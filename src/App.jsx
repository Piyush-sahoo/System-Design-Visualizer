import {
  Activity,
  ArrowDown,
  ArrowLeft,
  Code,
  Image as ImageIcon,
  Layout,
  MessageSquare,
  Settings,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import ChatBuilder from "./components/ChatBuilder";
import InfoPanel from "./components/InfoPanel";
import MermaidDisplay from "./components/MermaidDisplay";
import SettingsModal from "./components/SettingsModal";
import SystemDiagram from "./components/SystemDiagram";
import ThemeToggle from "./components/ThemeToggle";
import UploadZone from "./components/UploadZone";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import {
  convertMermaidToFlow,
  generateMermaidFromImage,
} from "./services/analysisService";

function AppContent() {
  // Mode: null = landing, 'upload' = image upload flow, 'chat' = chat builder flow
  const [mode, setMode] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [mermaidCode, setMermaidCode] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [designSummary, setDesignSummary] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { apiKey, provider } = useSettings();

  const interactiveSectionRef = useRef(null);

  const handleUpload = async (file) => {
    console.log("App: handleUpload called with file:", file);

    // Create a local URL for the uploaded image to display it
    const objectUrl = URL.createObjectURL(file);
    setUploadedImageUrl(objectUrl);

    setIsAnalyzing(true);
    try {
      console.log("App: calling generateMermaidFromImage...");
      // Pass apiKey and provider to service
      const code = await generateMermaidFromImage(file, apiKey, provider);
      console.log("App: generateMermaidFromImage returned:", code);
      setMermaidCode(code);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConvertToInteractive = async () => {
    if (!mermaidCode) return;
    setIsConverting(true);
    try {
      console.log("App: calling convertMermaidToFlow...");
      // Pass apiKey and provider to service
      const data = await convertMermaidToFlow(mermaidCode, apiKey, provider);
      console.log("App: convertMermaidToFlow returned:", data);
      setGraphData(data);

      // Scroll to interactive section after a short delay to allow render
      setTimeout(() => {
        interactiveSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Conversion failed:", error);
    } finally {
      setIsConverting(false);
    }
  };

  // Handle design generated from ChatBuilder
  const handleDesignGenerated = (design) => {
    console.log("App: Design generated from chat:", design);
    setDesignSummary(design.summary);
    setMermaidCode(design.mermaidCode);
    setGraphData(design.flowData);
    // Switch to showing the results (like upload mode but without image)
    setMode("chat-result");
  };

  const handleReset = () => {
    setMode(null);
    setGraphData(null);
    setMermaidCode(null);
    setUploadedImageUrl(null);
    setSelectedNode(null);
    setDesignSummary(null);
  };

  // Clean up object URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

  const showDashboard = uploadedImageUrl || mermaidCode || graphData;
  const isInUploadFlow = mode === "upload" && showDashboard;
  const isInChatResultFlow = mode === "chat-result" && (mermaidCode || graphData);

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-blue-500/30"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      <header
        className="border-b backdrop-blur-md sticky top-0 z-50"
        style={{
          borderColor: "var(--border-primary)",
          backgroundColor: "var(--bg-elevated)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg"
              style={{ boxShadow: "var(--accent-blue-glow)" }}
            >
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              System Design Visualizer
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {(isInUploadFlow || isInChatResultFlow || mode === "chat") && (
              <button
                onClick={handleReset}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: "var(--interactive-bg)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--interactive-hover)";
                  e.currentTarget.style.borderColor = "var(--border-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--interactive-bg)";
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                }}
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                Start Over
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: "var(--interactive-bg)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--interactive-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--interactive-bg)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              title="Configure API Keys"
            >
              <Settings className="w-5 h-5" />
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Landing Page - Mode Selection */}
        {mode === null && (
          <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div
                className="inline-flex items-center justify-center p-4 mb-6 rounded-full"
                style={{
                  backgroundColor: "var(--accent-blue-glow)",
                  border: "1px solid var(--accent-blue)",
                }}
              >
                <Activity
                  className="w-8 h-8"
                  style={{ color: "var(--accent-blue)" }}
                />
              </div>
              <h2
                className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Bring your architecture to life
              </h2>
              <p
                className="text-lg leading-relaxed max-w-xl mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Choose how you want to create your interactive system design
                diagram
              </p>

              {/* API Key CTA - Show if no key is set */}
              {!apiKey && (
                <div
                  className="mt-8 p-4 rounded-xl border flex items-center justify-between gap-4 max-w-lg mx-auto animate-in slide-in-from-bottom-4 duration-700 delay-200"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--accent-blue)",
                    boxShadow: "var(--accent-blue-glow)"
                  }}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Missing API Key</h3>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Add your OpenAI or Gemini key to get started</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: "var(--accent-blue)" }}
                  >
                    Add Key
                  </button>
                </div>
              )}
            </div>

            {/* Mode Selection Cards */}
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
              {/* Upload Image Card */}
              <button
                onClick={() => setMode("upload")}
                className="group flex-1 p-8 rounded-2xl text-left transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "2px solid var(--border-primary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-blue)";
                  e.currentTarget.style.boxShadow = "var(--accent-blue-glow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="p-4 rounded-xl mb-4 inline-flex"
                  style={{
                    backgroundColor: "var(--accent-blue-glow)",
                    border: "1px solid var(--accent-blue)",
                  }}
                >
                  <Upload
                    className="w-8 h-8"
                    style={{ color: "var(--accent-blue)" }}
                  />
                </div>
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Upload Image
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Have an existing diagram? Upload a screenshot or image of your
                  system architecture and let AI convert it to an interactive
                  visualization.
                </p>
                <div
                  className="mt-6 flex items-center gap-2 text-sm font-medium"
                  style={{ color: "var(--accent-blue)" }}
                >
                  Get started
                  <ArrowDown className="w-4 h-4 rotate-[-90deg] transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              {/* Build from Scratch Card */}
              <button
                onClick={() => setMode("chat")}
                className="group flex-1 p-8 rounded-2xl text-left transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "2px solid var(--border-primary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-purple)";
                  e.currentTarget.style.boxShadow =
                    "0 0 30px rgba(168, 85, 247, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="p-4 rounded-xl mb-4 inline-flex"
                  style={{
                    backgroundColor: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid var(--accent-purple)",
                  }}
                >
                  <MessageSquare
                    className="w-8 h-8"
                    style={{ color: "var(--accent-purple)" }}
                  />
                </div>
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Build from Scratch
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Don't have a diagram? Tell me about your project and I'll ask
                  the right questions to design a microservice architecture for
                  you.
                </p>
                <div
                  className="mt-6 flex items-center gap-2 text-sm font-medium"
                  style={{ color: "var(--accent-purple)" }}
                >
                  Start chatting
                  <ArrowDown className="w-4 h-4 rotate-[-90deg] transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Upload Mode - No Image Yet */}
        {mode === "upload" && !showDashboard && (
          <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2
                className="text-3xl font-bold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Upload your system design
              </h2>
              <p style={{ color: "var(--text-secondary)" }}>
                Drop an image of your architecture diagram and watch it come to
                life
              </p>
            </div>
            <UploadZone onUpload={handleUpload} isAnalyzing={isAnalyzing} />
          </div>
        )}

        {/* Chat Mode */}
        {mode === "chat" && (
          <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-6 pt-8 animate-in fade-in duration-500">
            <ChatBuilder
              onDesignGenerated={handleDesignGenerated}
              onCancel={handleReset}
              apiKey={apiKey}
              provider={provider}
            />
          </div>
        )}

        {/* Results Dashboard (Upload or Chat Result) */}
        {(isInUploadFlow || isInChatResultFlow) && (
          <div className="flex flex-col p-6 gap-6 max-w-[1920px] mx-auto animate-in fade-in duration-500">
            {/* Design Summary (for chat-generated designs) */}
            {designSummary && (
              <div
                className="p-4 rounded-xl"
                style={{
                  backgroundColor: "var(--accent-blue-glow)",
                  border: "1px solid var(--accent-blue)",
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span style={{ color: "var(--accent-blue)" }}>
                    ✨ Generated:{" "}
                  </span>
                  {designSummary}
                </p>
              </div>
            )}

            {/* Row 1: Source Materials */}
            <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
              {/* Top Left: Original Image or Placeholder (35%) */}
              <div
                className="lg:w-[35%] flex flex-col rounded-xl overflow-hidden"
                style={{
                  border: "1px solid var(--border-secondary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <div
                  className="px-5 py-3 flex items-center gap-2.5"
                  style={{
                    borderBottom: "1px solid var(--border-secondary)",
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                >
                  <ImageIcon
                    className="w-4 h-4"
                    style={{ color: "var(--accent-blue)" }}
                  />
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {uploadedImageUrl ? "Original Design" : "AI Generated"}
                  </h3>
                </div>
                <div
                  className="flex-1 p-6 overflow-auto flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-overlay)" }}
                >
                  {uploadedImageUrl ? (
                    <img
                      src={uploadedImageUrl}
                      alt="Original System Design"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      style={{
                        boxShadow: "var(--shadow-xl)",
                        border: "1px solid var(--border-primary)",
                      }}
                    />
                  ) : (
                    <div
                      className="text-center p-8"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <MessageSquare
                        className="w-16 h-16 mx-auto mb-4 opacity-50"
                        style={{ color: "var(--accent-purple)" }}
                      />
                      <p className="text-sm">
                        Design generated from conversation
                      </p>
                      <p
                        className="text-xs mt-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No source image
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Right: Mermaid Diagram (65%) */}
              <div
                className="lg:w-[65%] flex flex-col rounded-xl overflow-hidden"
                style={{
                  border: "1px solid var(--border-secondary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{
                    borderBottom: "1px solid var(--border-secondary)",
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Code
                      className="w-4 h-4"
                      style={{ color: "var(--accent-purple)" }}
                    />
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Mermaid Definition
                    </h3>
                  </div>
                  {mermaidCode && !graphData && (
                    <button
                      onClick={handleConvertToInteractive}
                      disabled={isConverting}
                      className="group flex items-center gap-2 px-4 py-1.5 rounded-md text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "var(--accent-blue)",
                        boxShadow: "var(--accent-blue-glow)",
                      }}
                    >
                      {isConverting
                        ? "Converting..."
                        : "Convert to Interactive"}
                      <ArrowDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
                    </button>
                  )}
                </div>
                <div
                  className="flex-1 p-4 overflow-hidden relative"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  {mermaidCode ? (
                    <MermaidDisplay chart={mermaidCode} />
                  ) : isAnalyzing ? (
                    <div
                      className="h-full flex flex-col items-center justify-center gap-3 animate-pulse"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <div
                        className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                        style={{
                          borderColor: "var(--accent-blue)",
                          borderTopColor: "transparent",
                        }}
                      />
                      <span className="text-sm">
                        Generating Mermaid diagram...
                      </span>
                    </div>
                  ) : (
                    <div
                      className="h-full flex items-center justify-center text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Waiting for analysis...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Interactive Diagram (Full Width) */}
            <div
              ref={interactiveSectionRef}
              className="h-[800px] flex flex-col rounded-xl overflow-hidden"
              style={{
                border: "1px solid var(--border-secondary)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  borderBottom: "1px solid var(--border-secondary)",
                  backgroundColor: "var(--bg-tertiary)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Activity
                    className="w-4 h-4"
                    style={{ color: "var(--accent-emerald)" }}
                  />
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Interactive Visualization
                  </h3>
                </div>
              </div>

              <div
                className="flex-1 relative"
                style={{ backgroundColor: "var(--bg-primary)" }}
              >
                {graphData ? (
                  <>
                    <ReactFlowProvider>
                      <SystemDiagram
                        initialNodes={graphData.nodes}
                        initialEdges={graphData.edges}
                        onNodeClick={setSelectedNode}
                      />
                    </ReactFlowProvider>
                    <InfoPanel
                      node={selectedNode}
                      onClose={() => setSelectedNode(null)}
                    />
                  </>
                ) : (
                  <div
                    className="h-full flex flex-col items-center justify-center p-8 text-center"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {mermaidCode ? (
                      <div className="max-w-md space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div
                          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            border: "1px solid var(--border-secondary)",
                            boxShadow: "var(--shadow-xl)",
                          }}
                        >
                          <Activity
                            className="w-8 h-8"
                            style={{ color: "var(--accent-blue)" }}
                          />
                        </div>
                        <h3
                          className="text-xl font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Ready to Visualize
                        </h3>
                        <p style={{ color: "var(--text-secondary)" }}>
                          Review the Mermaid diagram above. When you're ready,
                          click "Convert to Interactive" to generate the
                          explorable graph.
                        </p>
                        <button
                          onClick={handleConvertToInteractive}
                          disabled={isConverting}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all disabled:opacity-50"
                          style={{
                            backgroundColor: "var(--accent-blue)",
                            boxShadow: "var(--accent-blue-glow)",
                          }}
                        >
                          {isConverting
                            ? "Converting..."
                            : "Convert to Interactive"}
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            border: "1px solid var(--border-secondary)",
                          }}
                        >
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <p>Upload an image to start the analysis.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
