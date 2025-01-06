import logging
import aiohttp
import os
import json

from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
    AgentState,
)
from livekit.agents.llm import (
    ChatContext, 
    ToolChoice, 
    ChatChunk, 
    Choice, 
    ChoiceDelta
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.agents import DEFAULT_API_CONNECT_OPTIONS
from livekit.plugins import openai, deepgram, silero
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import HumanMessage, AIMessage, FunctionMessage
from langgraph.checkpoint.memory import MemorySaver
from typing import Callable, Any, Union, AsyncIterator, Optional, Literal

from main import create_app

load_dotenv(dotenv_path=".env")  # Changed from .env.local since we're using .env
logger = logging.getLogger("voice-agent")

class LangGraphLLM(llm.LLM):
    def __init__(
        self,
        graph_app,
    ) -> None:
        """Initialize with your LangGraph application"""
        super().__init__()
        self.graph_app = graph_app
        self._capabilities = llm.LLMCapabilities(supports_choices_on_int=True)

    def chat(
        self,
        *,
        chat_ctx: ChatContext,
        fnc_ctx: Optional[llm.FunctionContext] = None,
        temperature: Optional[float] = None,
        n: Optional[int] = None,
        parallel_tool_calls: Optional[bool] = None,
        tool_choice: Optional[Union[ToolChoice, Literal["auto", "required", "none"]]] = None,
    ) -> "LangGraphStream":
        if fnc_ctx is not None:
            logger.warning("fnc_ctx is currently not supported with LangGraphLLM")

        return LangGraphStream(
            self,
            graph_app=self.graph_app,
            chat_ctx=chat_ctx,
            fnc_ctx=fnc_ctx,
        )

class LangGraphStream(llm.LLMStream):
    def __init__(
        self,
        llm: LangGraphLLM,
        *,
        graph_app,
        chat_ctx: ChatContext,
        fnc_ctx: Optional[llm.FunctionContext] = None,
    ) -> None:
        super().__init__(
            llm, 
            chat_ctx=chat_ctx, 
            fnc_ctx=fnc_ctx,
            conn_options=DEFAULT_API_CONNECT_OPTIONS
        )
        self.graph_app = graph_app
        self._llm = llm
        self._message_history = []  # Store message history
        self._has_generated_contract = False  # Track if contract was generated

    async def _main_task(self) -> None:
        """Main task that processes messages through the graph"""
        chat_ctx = self._chat_ctx.copy()
        
        # Convert all previous messages to LangChain format
        messages = []
        for msg in chat_ctx.messages[:-1]:  # All messages except the last one
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
        
        # Add the current user message
        user_msg = chat_ctx.messages[-1]
        if user_msg.role != "user":
            raise ValueError("The last message in the chat context must be from the user")
        messages.append(HumanMessage(content=user_msg.content))

        try:
            # Process through graph with full message history
            result = self.graph_app.invoke(
                {"messages": messages},
                {"configurable": {"thread_id": str(id(self))}}
            )

            # Get last message and create chunk
            last_message = result["messages"][-1]
            
            # Store the assistant's response in history
            self._message_history.append(last_message)
            
            # Check if this was a function call to generate_contract
            if isinstance(last_message, FunctionMessage) and "generate_contract" in last_message.content:
                self._has_generated_contract = True

            # Send response as a chunk
            self._event_ch.send_nowait(
                ChatChunk(
                    request_id=str(id(self)),
                    choices=[
                        Choice(
                            delta=ChoiceDelta(
                                role="assistant",
                                content=last_message.content
                            )
                        )
                    ],
                )
            )

            # If we have all required info but haven't generated contract, do it now
            if not self._has_generated_contract and self._has_all_required_info():
                await self._generate_contract()

        except Exception as e:
            logger.error(f"Error processing through graph: {e}")
            raise

    def _has_all_required_info(self) -> bool:
        """Check if we have all required contract information"""
        required_fields = {
            "buyer_name": False,
            "street_address": False,
            "sales_price": False,
            "down_payment_amount": False,
            "financing_contingent": False,
            "conventional_financing": False
        }
        
        for message in self._message_history:
            if isinstance(message, FunctionMessage):
                # Extract field values from function calls
                content = message.content
                if isinstance(content, str):
                    for field in required_fields:
                        if f'"{field}":' in content:
                            required_fields[field] = True
                            
        return all(required_fields.values())

    async def _generate_contract(self) -> None:
        """Generate contract using collected information"""
        try:
            # Extract the latest contract data from message history
            contract_data = {}
            for message in reversed(self._message_history):
                if isinstance(message, FunctionMessage):
                    content = message.content
                    if isinstance(content, str) and "generate_contract" in content:
                        # Extract the contract data
                        start_idx = content.find("{")
                        end_idx = content.rfind("}") + 1
                        if start_idx != -1 and end_idx != -1:
                            contract_data = json.loads(content[start_idx:end_idx])
                            break
            
            if contract_data:
                # Validate required fields are present
                required_fields = [
                    "sales_price",
                    "down_payment_amount",
                    "buyer_name",
                    "street_address",
                    "conventional_financing",
                    "financing_contingent"
                ]
                
                if all(field in contract_data for field in required_fields):
                    try:
                        # Call run-tooltest endpoint to generate contract
                        backend_url = os.getenv('NEXT_PUBLIC_BACKEND_URL', 'http://localhost:8000')
                        async with aiohttp.ClientSession() as session:
                            async with session.post(
                                f"{backend_url}/run-tooltest",
                                json=contract_data
                            ) as response:
                                if response.status == 200:
                                    response_data = await response.json()
                                    if response_data.get('url'):
                                        await self.say("I've collected all the necessary information and generated the contract. You can view it on the page now.", allow_interruptions=True)
                                        self._has_generated_contract = True
                                        logger.info("Contract generated successfully")
                                    else:
                                        raise Exception("No URL in response")
                                else:
                                    raise Exception(f"Failed to generate contract: {await response.text()}")
                            
                    except Exception as e:
                        logger.error(f"Error running tooltest: {e}")
                        await self.say("I apologize, but there was an error generating the contract. Please try again.", allow_interruptions=True)
                else:
                    missing_fields = [field for field in required_fields if field not in contract_data]
                    logger.error(f"Missing required fields: {missing_fields}")
                    await self.say("I still need some information before I can generate the contract. Let me ask you about those details.", allow_interruptions=True)
                
        except Exception as e:
            logger.error(f"Error auto-generating contract: {e}")

    async def _run(self) -> None:
        """Run the stream processing"""
        await self._main_task()

def prewarm(proc: JobProcess):
    """Initialize components during prewarm phase"""
    proc.userdata["vad"] = silero.VAD.load()
    proc.userdata["graph_app"] = create_app()  # Create graph app during prewarm

async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are a voice assistant created to be an expert on real estate and contracts, respond to voice queries and help enabling users to create contracts such as residential sales contracts through natural conversation. Your interface with users will be voice but can be used to enable text to be filled out. "
            "You should use short and concise responses, and avoiding usage of unpronouncable punctuation. "
        ),
    )

    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the first participant to connect
    participant = await ctx.wait_for_participant()
    logger.info(f"starting voice assistant for participant {participant.identity}")

    # Use the graph app created during prewarm
    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(),
        llm=LangGraphLLM(ctx.proc.userdata["graph_app"]),
        tts=openai.TTS(),
        chat_ctx=initial_ctx,
    )

    agent.start(ctx.room, participant)

    # The agent should be polite and greet the user when it joins :)
    await agent.say("Hey, how can I help you today?", allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
