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
import { PDFDocument, PDFField } from 'pdf-lib';

type VoiceAssistantWithTranscript = ReturnType<typeof useVoiceAssistant> & {
  transcript?: string;
};

interface ContractData {
  propertyAddress: string;
  buyerName: string;
  sellerName: string;
  purchasePrice: string;
  downPayment: string;
  downPaymentPercent: string;
  loanAmount: string;
  financingType: string;
  buyerDeposit: string;
  closingDate: string;
  inspectionPeriod: string;
  contingencies: string;
  otherTerms: string;
}

export default function GenerateContract() {
  const [connectionDetails, updateConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined);
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [connectionHealth, setConnectionHealth] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');
  const [contractData, setContractData] = useState<ContractData>({
    propertyAddress: '',
    buyerName: '',
    sellerName: '',
    purchasePrice: '',
    downPayment: '',
    downPaymentPercent: '',
    loanAmount: '',
    financingType: '',
    buyerDeposit: '',
    closingDate: '',
    inspectionPeriod: '',
    contingencies: '',
    otherTerms: ''
  });
  const [modifiedPdfUrl, setModifiedPdfUrl] = useState<string>('');
  const [activeField, setActiveField] = useState<keyof ContractData | null>(null);

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

  const modifyPdf = async (data: ContractData) => {
    try {
      const response = await fetch('/Virginia-REALTORS-Form-420-Independent-Contractor-Listing-Agreement-2019-01-Redline.pdf');
      const pdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      // Debug: Log all available field names
      console.log('PDF Form Fields:', fields.map((field: PDFField) => ({
        name: field.getName(),
        type: field.constructor.name
      })));
      
      fields.forEach((field: PDFField) => {
        try {
          const fieldName = field.getName().toLowerCase();
          const textField = form.getTextField(field.getName());
          
          // Debug: Log each field attempt
          console.log('Processing field:', fieldName);
          
          // Map form data to PDF fields - adjust field names based on the Virginia REALTORS form
          if (fieldName.includes('address') || fieldName.includes('property')) {
            console.log('Setting property address for field:', fieldName);
            textField.setText(data.propertyAddress);
          } else if (fieldName.includes('buyer') || fieldName.includes('purchaser')) {
            console.log('Setting buyer name for field:', fieldName);
            textField.setText(data.buyerName);
          } else if (fieldName.includes('seller') || fieldName.includes('owner')) {
            console.log('Setting seller name for field:', fieldName);
            textField.setText(data.sellerName);
          } else if (fieldName.includes('price') || fieldName.includes('amount')) {
            console.log('Setting price for field:', fieldName);
            textField.setText(data.purchasePrice);
          } else if (fieldName.includes('down_payment') || fieldName.includes('deposit')) {
            console.log('Setting down payment for field:', fieldName);
            textField.setText(data.downPayment);
          } else if (fieldName.includes('financing') || fieldName.includes('payment_type')) {
            console.log('Setting financing type for field:', fieldName);
            textField.setText(data.financingType);
          } else if (fieldName.includes('earnest') || fieldName.includes('deposit')) {
            console.log('Setting buyer deposit for field:', fieldName);
            textField.setText(data.buyerDeposit);
          } else if (fieldName.includes('closing') || fieldName.includes('settlement')) {
            console.log('Setting closing date for field:', fieldName);
            textField.setText(data.closingDate);
          } else if (fieldName.includes('inspection') || fieldName.includes('study')) {
            console.log('Setting inspection period for field:', fieldName);
            textField.setText(data.inspectionPeriod);
          } else if (fieldName.includes('contingencies') || fieldName.includes('conditions')) {
            console.log('Setting contingencies for field:', fieldName);
            textField.setText(data.contingencies);
          } else if (fieldName.includes('terms') || fieldName.includes('additional')) {
            console.log('Setting other terms for field:', fieldName);
            textField.setText(data.otherTerms);
          }
        } catch (fieldError) {
          console.error('Error processing field:', field.getName(), fieldError);
        }
      });

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setModifiedPdfUrl(url);
    } catch (error) {
      console.error('Error modifying PDF:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedData = {
      ...contractData,
      [name]: value
    };
    setContractData(updatedData);
    setActiveField(name as keyof ContractData);
    modifyPdf(updatedData);
    
    // Clear active field after a delay
    setTimeout(() => {
      setActiveField(null);
    }, 2000);
  };

  // Function to update form field from voice input
  const updateFieldFromVoice = (field: keyof ContractData, value: string) => {
    setActiveField(field);
    setContractData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      modifyPdf(updated);
      return updated;
    });
    
    // Clear active field after a delay
    setTimeout(() => {
      setActiveField(null);
    }, 2000);
  };

  useEffect(() => {
    if (contractData.purchasePrice && contractData.downPayment) {
      const price = parseFloat(contractData.purchasePrice.replace(/[^0-9.]/g, ''));
      const downPayment = parseFloat(contractData.downPayment.replace(/[^0-9.]/g, ''));
      if (!isNaN(price) && !isNaN(downPayment)) {
        const loanAmount = price - downPayment;
        const downPaymentPercent = ((downPayment / price) * 100).toFixed(2);
        setContractData(prev => ({
          ...prev,
          loanAmount: loanAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
          downPaymentPercent: `${downPaymentPercent}%`
        }));
      }
    }
  }, [contractData.purchasePrice, contractData.downPayment]);

  useEffect(() => {
    modifyPdf(contractData);
  }, []);

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
                onVoiceInput={updateFieldFromVoice}
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

        {/* Split Screen Contract Section */}
        <div className="flex flex-col md:flex-row flex-1 w-full">
          {/* Left side - Form */}
          <div className="w-full md:w-1/2 p-4 md:p-6 bg-gray-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Contract Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Address
                  </label>
                  <input
                    type="text"
                    name="propertyAddress"
                    value={contractData.propertyAddress}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      activeField === 'propertyAddress' 
                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-gray-300'
                    }`}
                    placeholder="Enter complete property address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buyer Name
                    </label>
                    <input
                      type="text"
                      name="buyerName"
                      value={contractData.buyerName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        activeField === 'buyerName'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-300'
                      }`}
                      placeholder="Enter buyer's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seller Name
                    </label>
                    <input
                      type="text"
                      name="sellerName"
                      value={contractData.sellerName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        activeField === 'sellerName'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-300'
                      }`}
                      placeholder="Enter seller's name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price
                    </label>
                    <input
                      type="text"
                      name="purchasePrice"
                      value={contractData.purchasePrice}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        activeField === 'purchasePrice'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-300'
                      }`}
                      placeholder="Enter purchase price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Down Payment
                    </label>
                    <input
                      type="text"
                      name="downPayment"
                      value={contractData.downPayment}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        activeField === 'downPayment'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-300'
                      }`}
                      placeholder="Enter down payment amount"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Down Payment %
                    </label>
                    <input
                      type="text"
                      name="downPaymentPercent"
                      value={contractData.downPaymentPercent}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loan Amount
                    </label>
                    <input
                      type="text"
                      name="loanAmount"
                      value={contractData.loanAmount}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Financing Type
                  </label>
                  <select
                    name="financingType"
                    value={contractData.financingType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      activeField === 'financingType'
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select financing type</option>
                    <option value="Conventional">Conventional</option>
                    <option value="FHA">FHA</option>
                    <option value="VA">VA</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buyer Deposit
                  </label>
                  <input
                    type="text"
                    name="buyerDeposit"
                    value={contractData.buyerDeposit}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      activeField === 'buyerDeposit'
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-300'
                    }`}
                    placeholder="Enter earnest money deposit"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Closing Date
                    </label>
                    <input
                      type="date"
                      name="closingDate"
                      value={contractData.closingDate}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        activeField === 'closingDate'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inspection Period
                    </label>
                    <input
                      type="text"
                      name="inspectionPeriod"
                      value={contractData.inspectionPeriod}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        activeField === 'inspectionPeriod'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-300'
                      }`}
                      placeholder="Enter days for inspection"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contingencies
                  </label>
                  <textarea
                    name="contingencies"
                    value={contractData.contingencies}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      activeField === 'contingencies'
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-300'
                    }`}
                    rows={3}
                    placeholder="Enter any contingencies"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Terms
                  </label>
                  <textarea
                    name="otherTerms"
                    value={contractData.otherTerms}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      activeField === 'otherTerms'
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-300'
                    }`}
                    rows={3}
                    placeholder="Enter any additional terms"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right side - PDF Preview */}
          <div className="w-full md:w-1/2 p-4 md:p-6 bg-gray-100">
            <div className="bg-white rounded-lg shadow h-[500px] md:h-full p-4 overflow-y-auto">
              {modifiedPdfUrl ? (
                <iframe
                  src={modifiedPdfUrl}
                  className="w-full h-full"
                  title="Contract Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

function SimpleVoiceAssistant(props: {
  onStateChange: (state: AgentState) => void;
  onVoiceInput: (field: keyof ContractData, value: string) => void;
}) {
  const assistant = useVoiceAssistant() as VoiceAssistantWithTranscript;
  const { state, audioTrack, transcript } = assistant;
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');

  useEffect(() => {
    props.onStateChange(state);
  }, [props, state]);

  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscript) {
      setLastProcessedTranscript(transcript);
      
      // Process voice input and update form fields
      const processVoiceInput = () => {
        const text = transcript.toLowerCase();
        
        // Map common phrases to form fields
        const fieldMappings = {
          'property address': 'propertyAddress',
          'buyer name': 'buyerName',
          'seller name': 'sellerName',
          'purchase price': 'purchasePrice',
          'down payment': 'downPayment',
          'financing type': 'financingType',
          'buyer deposit': 'buyerDeposit',
          'closing date': 'closingDate',
          'inspection period': 'inspectionPeriod',
          'contingencies': 'contingencies',
          'other terms': 'otherTerms'
        };

        // Check for field matches and update form
        Object.entries(fieldMappings).forEach(([phrase, field]) => {
          if (text.includes(phrase)) {
            const value = text.split(phrase)[1]?.trim();
            if (value) {
              window.dispatchEvent(new CustomEvent('voiceInput', {
                detail: { field, value }
              }));
            }
          }
        });
      };

      processVoiceInput();
    }
  }, [transcript, lastProcessedTranscript]);

  // Add event listener for voice input
  useEffect(() => {
    const handleVoiceInput = (event: CustomEvent) => {
      const { field, value } = event.detail;
      props.onVoiceInput(field as keyof ContractData, value);
    };

    window.addEventListener('voiceInput', handleVoiceInput as EventListener);
    return () => {
      window.removeEventListener('voiceInput', handleVoiceInput as EventListener);
    };
  }, []);

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

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
