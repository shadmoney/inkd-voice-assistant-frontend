"use client";

import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "../../components/SearchBar";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  AgentState,
  DisconnectButton,
} from "@livekit/components-react";
import { useCallback, useEffect, useState } from "react";
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { MediaDeviceFailure } from "livekit-client";
import type { ConnectionDetails } from "../api/connection-details/route";
import { NoAgentNotification } from "../../components/NoAgentNotification";
import { CloseIcon } from "../../components/CloseIcon";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import DashboardLayout from "../../components/DashboardLayout";

type VoiceAssistantWithTranscript = ReturnType<typeof useVoiceAssistant> & {
  transcript?: string;
};

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}

function SimpleVoiceAssistant(props: {
  onStateChange: (state: AgentState) => void;
}) {
  const assistant = useVoiceAssistant() as VoiceAssistantWithTranscript;
  const { state, audioTrack, transcript } = assistant;

  useEffect(() => {
    props.onStateChange(state);
  }, [props, state]);

  return (
    <div className="h-[200px] sm:h-[300px] w-full mx-auto flex flex-col items-center justify-center">
      {transcript && (
        <div className="text-sm text-gray-600 mb-4 text-center">
          {transcript}
        </div>
      )}
      <BarVisualizer
        state={state}
        barCount={3}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ 
          minHeight: 24,
        }}
      />
    </div>
  );
}

function ControlBar(props: {
  onConnectButtonClicked: () => void;
  agentState: AgentState;
}) {
  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp.setNoiseFilterEnabled(true);
  }, []);

  return (
    <div className="relative">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-accent text-white rounded-full px-6 py-4 text-base sm:text-lg hover:bg-opacity-90 transition-colors touch-manipulation"
            onClick={() => props.onConnectButtonClicked()}
          >
            Tap to speak
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {props.agentState === "connecting" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-2"
          >
            <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
            <span className="text-gray-600">Connecting...</span>
          </motion.div>
        )}
        {props.agentState !== "disconnected" &&
          props.agentState !== "connecting" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex items-center space-x-4"
            >
              <div className="touch-manipulation">
                <VoiceAssistantControlBar controls={{ leave: false }} />
              </div>
              <DisconnectButton>
                <CloseIcon />
              </DisconnectButton>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

export default function GenerateContract() {
  const [connectionDetails, updateConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined);
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [connectionHealth, setConnectionHealth] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');
  const pdfUrl = "https://inkd-contracts.s3.us-east-1.amazonaws.com/Filled%20VA%20Sales%20Contract.pdf";

  const { user, authenticated } = usePrivy();
  const { login } = useLogin();
  
  const checkServerHealth = async () => {
    if (!authenticated || !user?.id) {
      setConnectionHealth('unhealthy');
      return;
    }

    try {
      const url = new URL(
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? 
        "/api/connection-details",
        window.location.origin
      );
      url.searchParams.set('userId', user.id);
      const response = await fetch(url.toString());
      if (!response.ok) {
        setConnectionHealth('unhealthy');
        throw new Error('Failed to connect to voice agent server');
      }
      const details = await response.json();
      setConnectionHealth('healthy');
      return details;
    } catch (error) {
      console.error('Connection health check failed:', error);
      setConnectionHealth('unhealthy');
      throw error;
    }
  };

  const onConnectButtonClicked = useCallback(async () => {
    if (!authenticated) {
      login();
      return;
    }

    if (!user?.id) {
      setConnectionHealth('unhealthy');
      return;
    }

    setAgentState("connecting");
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });

    try {
      const connectionDetailsData = await Promise.race([
        checkServerHealth(),
        timeoutPromise
      ]);
      if (connectionDetailsData) {
        updateConnectionDetails(connectionDetailsData);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionHealth('unhealthy');
      setAgentState("disconnected");
    }
  }, [authenticated, login]);


  return (
    <DashboardLayout>
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-[90%] sm:max-w-2xl mx-auto mb-6">
          <SearchBar onSearch={(query: string) => console.log('Searching for:', query)} />
        </div>

        {/* Voice Assistant Section */}
        <div className="w-full max-w-[90%] sm:max-w-2xl mx-auto mb-8">
          {!authenticated ? (
            <div className="bg-white rounded-lg p-4 sm:p-8 text-center">
              <p className="text-gray-600 mb-4">Please log in to use the voice assistant</p>
              <button
                onClick={() => login()}
                className="bg-accent text-white rounded-full px-6 py-4 text-base sm:text-lg hover:bg-opacity-90 transition-colors"
              >
                Log In
              </button>
            </div>
          ) : (
            <LiveKitRoom
              token={connectionDetails?.participantToken}
              serverUrl={connectionDetails?.serverUrl}
              connect={connectionDetails !== undefined}
              audio={true}
              video={false}
              onMediaDeviceFailure={onDeviceFailure}
              onDisconnected={() => {
                updateConnectionDetails(undefined);
              }}
              className="w-full flex flex-col items-center bg-white rounded-lg p-4 sm:p-8"
            >
              <SimpleVoiceAssistant 
                onStateChange={setAgentState}
              />
              {connectionHealth === 'unhealthy' && agentState !== "connecting" && (
                <div className="text-red-500 mb-4">
                  Connection to voice agent server is currently unavailable
                </div>
              )}
              <ControlBar
                onConnectButtonClicked={onConnectButtonClicked}
                agentState={agentState}
              />
              <RoomAudioRenderer />
              <NoAgentNotification state={agentState} />
            </LiveKitRoom>
          )}
        </div>

        {/* PDF Preview */}
        <div className="flex-1 p-4 md:p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow h-[calc(100vh-300px)] p-4">
            {pdfUrl ? (
              <div className="w-full h-full relative">
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-gray-600 mb-4">Unable to display PDF directly.</p>
                    <a 
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-accent text-white px-4 py-2 rounded hover:bg-opacity-90"
                    >
                      Open PDF
                    </a>
                  </div>
                </object>
                <div className="absolute top-4 right-4">
                  <a 
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-accent text-white px-4 py-2 rounded hover:bg-opacity-90"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                {pdfUrl === null ? (
                  <div className="text-center">
                    <p className="text-red-500 mb-4">Failed to load contract form</p>
                    <button
                      onClick={fetchContractForm}
                      className="bg-accent text-white px-4 py-2 rounded hover:bg-opacity-90"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
