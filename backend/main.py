# main.py
from typing import Annotated, TypedDict, Dict, Any, List, Sequence, Union
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

from config import SYSTEM_PROMPT, MODEL_NAME, GROQ_API_KEY, LANGCHAIN_API_KEY, LANGCHAIN_TRACING_V2, LANGCHAIN_ENDPOINT, LANGCHAIN_PROJECT
from tools import ContractData, fill_contract
from s3_utils import S3Utils

# Get absolute path to template
template_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), 
    "templates",
    "VAResidentialSalesContractP1.pdf"
)

# Define contract generation tool 
@tool(args_schema=ContractData)
def generate_contract(user_id: str = None, **contract_data: Dict) -> str:
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
        contract = ContractData.model_validate(contract_data)
        formatted_data = {
            "Sales Price": contract.sales_price,
            "Down Payment $": contract.down_payment_amount,
            "Buyer Name": contract.buyer_name,
            "Street Address": contract.street_address,
            "Conventional Financing": contract.conventional_financing,
            "Financing IS Contingent": contract.financing_contingent
        }


        # Verify template exists
        if not os.path.exists(template_path):
            raise FileNotFoundError(f"Contract template not found at: {template_path}")
            
        pdf_content = fill_contract(
            contract, 
            template_path
        )
        
        # Upload to S3
        s3 = S3Utils()
        file_name = f"contract_{uuid.uuid4().hex[:8]}.pdf"
        s3_url = s3.upload_file(pdf_content, file_name, user_id)
            
        return json.dumps({
            "message": "Contract generated successfully",
            "url": s3_url
        })
        
    except Exception as e:
        return f"Error generating contract: {str(e)}"

def create_app():
    """
    Create and configure the application
    
    Returns:
        Compiled LangGraph application
    """
    tools = [generate_contract]
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
