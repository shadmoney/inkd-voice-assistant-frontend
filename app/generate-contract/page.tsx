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
import { MediaDeviceFailure } from "livekit-client";
import type { ConnectionDetails } from "../api/connection-details/route";
import { NoAgentNotification } from "../../components/NoAgentNotification";
import { CloseIcon } from "../../components/CloseIcon";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import DashboardLayout from "../../components/DashboardLayout";

export default function GenerateContract() {
  const [connectionDetails, updateConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined);
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [showTapToSpeak, setShowTapToSpeak] = useState(true);

  const onConnectButtonClicked = useCallback(async () => {
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ??
      "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData = await response.json();
    updateConnectionDetails(connectionDetailsData);
    setShowTapToSpeak(false);
  }, []);

  return (
    <DashboardLayout>
      <main className="flex-1 flex flex-col items-center px-4 sm:px-0">
        <div className="w-full max-w-[90%] sm:max-w-2xl mb-6 sm:mb-8">
          <SearchBar onSearch={(query) => console.log('Searching for:', query)} />
        </div>
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
          className="w-full max-w-[90%] sm:max-w-2xl mx-auto flex flex-col items-center bg-white rounded-lg p-4 sm:p-8"
        >
          <SimpleVoiceAssistant onStateChange={setAgentState} />
          {showTapToSpeak}
          <ControlBar
            onConnectButtonClicked={onConnectButtonClicked}
            agentState={agentState}
          />
          <RoomAudioRenderer />
          <NoAgentNotification state={agentState} />
        </LiveKitRoom>
      </main>
    </DashboardLayout>
  );
}

function SimpleVoiceAssistant(props: {
  onStateChange: (state: AgentState) => void;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  useEffect(() => {
    props.onStateChange(state);
  }, [props, state]);
  return (
    <div className="h-[200px] sm:h-[300px] w-full mx-auto flex flex-col items-center justify-center">
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

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
