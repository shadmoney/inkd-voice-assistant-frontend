from typing import Annotated, TypedDict, Dict, Any, List, Sequence, Union
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import boto3
from botocore.exceptions import ClientError
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, MessagesState, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode, tools_condition
import streamlit as st
import uuid
import json
import os
from pathlib import Path

from .config import (
    SYSTEM_PROMPT, MODEL_NAME, GROQ_API_KEY,
    AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME
)
from .tools import ContractData, fill_contract

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Content-Disposition", "Content-Length"],
    max_age=3600,
)

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

def generate_presigned_url(object_name: str, expiration: int = 3600) -> str:
    """Generate a presigned URL for an S3 object"""
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': AWS_BUCKET_NAME,
                'Key': object_name,
                'ResponseContentType': 'application/pdf',
                'ResponseContentDisposition': 'inline'
            },
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate presigned URL")

@app.get("/contract-form")
async def get_contract_form():
    """Get the contract form template"""
    try:
        try:
            # Get the PDF directly from S3
            response = s3_client.get_object(
                Bucket=AWS_BUCKET_NAME,
                Key='Filled VA Sales Contract.pdf'
            )
            
            # Generate a presigned URL for the PDF
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': AWS_BUCKET_NAME,
                    'Key': 'Filled VA Sales Contract.pdf',
                    'ResponseContentType': 'application/pdf',
                    'ResponseContentDisposition': 'inline; filename="contract.pdf"'
                },
                ExpiresIn=3600
            )
            return {"url": url}
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                raise HTTPException(status_code=404, detail="PDF file not found")
            elif error_code == 'NoSuchBucket':
                raise HTTPException(status_code=500, detail="S3 bucket not found")
            else:
                raise HTTPException(status_code=500, detail=f"S3 error: {str(e)}")
    except Exception as e:
        print(f"Error getting contract form: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# LangChain Tool Definition
@tool(args_schema=ContractData)
def generate_contract(contract_data: Dict) -> str:
    """Generate a residential sales contract PDF using provided data.
    
    This tool creates a residential sales contract based on the provided information.
    All monetary values should be provided as plain numbers without commas or symbols.
    
    Args:
        contract_data: Dictionary containing contract information including:
            - Property details (address tax ID legal description)
            - Financial details (price financing down payment)
            - Party information (buyer seller brokers)
            - Contingencies and terms
    
    Returns:
        str: Success message or detailed error message if generation fails
        
    Example:
        >>> generate_contract({
        ...     "sales_price": "450000",  # NOT "$450,000"
        ...     "down_payment_amount": "90000",
        ...     "buyer_name": "John Smith"
        ... })
    """
    try:
        # Upload the filled contract to S3
        output_key = f"contracts/contract_{uuid.uuid4().hex[:8]}.pdf"
        s3_client.put_object(
            Bucket=AWS_BUCKET_NAME,
            Key=output_key,
            Body=contract_data,
            ContentType='application/pdf'
        )
        
        # Generate presigned URL for the uploaded contract
        url = generate_presigned_url(output_key)
        return f"Contract generated successfully. Access at: {url}"
    except Exception as e:
        return f"Error generating contract: {str(e)}"

def create_app():
    """Create and configure the LangChain application"""
    tools = [fill_contract]
    # Initialize LLM
    llm = ChatGroq(
        api_key=GROQ_API_KEY,
        model=MODEL_NAME   
    ).bind_tools(tools)
    
    # Create prompt template
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    # Create graph
    workflow = StateGraph(state_schema=MessagesState)

    # Create tool node
    tool_node = ToolNode(tools=tools)
    
    def call_agent(state: MessagesState):
        prompt = prompt_template.invoke(state)
        response = llm.invoke(prompt)
        return {"messages": [response]}

    # Add nodes
    workflow.add_edge(START, "agent")
    workflow.add_node("agent", call_agent)
    workflow.add_node("tools", tool_node)

    workflow.add_conditional_edges(
        "agent",
        tools_condition,
        {
            "tools": "tools",
            END: END
        }
    )

    workflow.add_edge("tools", "agent")
    
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)
