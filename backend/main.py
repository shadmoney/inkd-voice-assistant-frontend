# main.py
from typing import Annotated, TypedDict, Dict, Any, List, Sequence, Union, Optional
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

from config import (
    SYSTEM_PROMPT, MODEL_NAME, GROQ_API_KEY, 
    LANGCHAIN_API_KEY, LANGCHAIN_TRACING_V2, 
    LANGCHAIN_ENDPOINT, LANGCHAIN_PROJECT,
    CONTRACT_TEMPLATE_PATH, OUTPUT_DIR
)
from tools import ContractData, fill_contract

# Define contract generation tool 
@tool
def generate_contract(
    street_address: str,
    buyer_name: str,
    sales_price: str,
    down_payment_amount: str,
    first_trust_amount: Optional[str] = None,
    financing_type: Optional[str] = None,  # FHA, VA, Conventional, or USDA
    second_trust_amount: Optional[str] = None,
    seller_held_amount: Optional[str] = None,
    seller_subsidy_amount: Optional[str] = None,
    financing_contingent: Optional[bool] = None,
    **kwargs: Dict[str, Any]
) -> str:
    """Generate a residential sales contract PDF using provided data.
    
    Required Args:
        street_address: Property address
        buyer_name: Name of the buyer
        sales_price: Sales price as string number (e.g. "500000")
        down_payment_amount: Down payment as string number (e.g. "100000")
        
    Optional Args:
        first_trust_amount: First trust loan amount if financing
        financing_type: Type of financing (FHA, VA, Conventional, or USDA)
        second_trust_amount: Second trust loan amount if applicable
        seller_held_amount: Seller held trust amount if applicable
        seller_subsidy_amount: Seller subsidy amount if applicable
        financing_contingent: If financing is contingent
        **kwargs: Additional contract fields (seller_name, tax_id, etc.)
    """
    try:
        # Create base contract data
        contract_data = {
            "street_address": street_address,
            "buyer_name": buyer_name,
            "sales_price": sales_price,
            "down_payment_amount": down_payment_amount,
            "first_trust_amount": first_trust_amount,
            "second_trust_amount": second_trust_amount,
            "seller_held_amount": seller_held_amount,
            "seller_subsidy_amount": seller_subsidy_amount,
            "financing_contingent": financing_contingent
        }
        
        # Set financing type based on financing_type parameter
        if financing_type:
            financing_type = financing_type.lower()
            if financing_type == "fha":
                contract_data["fha_financing"] = True
            elif financing_type == "va":
                contract_data["va_financing"] = True
            elif financing_type == "conventional":
                contract_data["conventional_financing"] = True
            elif financing_type == "usda":
                contract_data["usda_financing"] = True
            else:
                contract_data["other_financing"] = True
                contract_data["other_financing_type"] = financing_type
        
        # Add any additional fields provided
        contract_data.update(kwargs)

        # Create and validate contract
        contract = ContractData.model_validate(contract_data)
        
        # Verify template exists
        if not os.path.exists(CONTRACT_TEMPLATE_PATH):
            raise FileNotFoundError(f"Contract template not found at: {CONTRACT_TEMPLATE_PATH}")
            
        pdf_content = fill_contract(contract, CONTRACT_TEMPLATE_PATH)
        
        # Save to file
        output_path = os.path.join(OUTPUT_DIR, f"contract_{uuid.uuid4().hex[:8]}.pdf")
        with open(output_path, "wb") as f:
            f.write(pdf_content)
            
        return f"Contract generated successfully and saved to: {output_path}"
        
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