import { Check, Save, Settings, X } from "lucide-react";
import { useState } from "react";
import { useSettings } from "../context/SettingsContext";

const SettingsModal = ({ isOpen, onClose }) => {
    const { provider, setProvider, apiKey, setApiKey } = useSettings();
    const [localKey, setLocalKey] = useState(apiKey);
    const [localProvider, setLocalProvider] = useState(provider);
    const [saved, setSaved] = useState(false);

    // Sync local state when modal opens
    if (!isOpen) return null;

    const handleSave = () => {
        setProvider(localProvider);
        setApiKey(localKey);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-primary)",
                }}
            >
                {/* Header */}
                <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{
                        borderBottom: "1px solid var(--border-secondary)",
                        backgroundColor: "var(--bg-tertiary)",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-400" />
                        <h2
                            className="text-lg font-semibold"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Settings
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors hover:bg-black/5"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-3">
                        <label
                            className="text-sm font-medium"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            AI Provider
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setLocalProvider("openai")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${localProvider === "openai"
                                        ? "border-blue-500 bg-blue-500/10 text-blue-500"
                                        : "border-transparent bg-black/5 hover:bg-black/10 text-gray-500"
                                    }`}
                            >
                                <div className="font-semibold">OpenAI</div>
                            </button>
                            <button
                                onClick={() => setLocalProvider("gemini")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${localProvider === "gemini"
                                        ? "border-purple-500 bg-purple-500/10 text-purple-500"
                                        : "border-transparent bg-black/5 hover:bg-black/10 text-gray-500"
                                    }`}
                            >
                                <div className="font-semibold">Gemini</div>
                            </button>
                        </div>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-3">
                        <label
                            className="text-sm font-medium"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            API Key
                        </label>
                        <input
                            type="password"
                            value={localKey}
                            onChange={(e) => setLocalKey(e.target.value)}
                            placeholder={`Enter your ${localProvider === "openai" ? "OpenAI" : "Gemini"
                                } API Key`}
                            className="w-full px-4 py-3 rounded-xl outline-none transition-all placeholder:text-gray-400"
                            style={{
                                backgroundColor: "var(--bg-tertiary)",
                                border: "1px solid var(--border-secondary)",
                                color: "var(--text-primary)",
                            }}
                        />
                        <p className="text-xs text-gray-500">
                            Your key is stored locally in your browser and never sent to our
                            servers.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="px-6 py-4 flex justify-end gap-3"
                    style={{
                        borderTop: "1px solid var(--border-secondary)",
                        backgroundColor: "var(--bg-tertiary)",
                    }}
                >
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saved}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white transition-all transform active:scale-95"
                        style={{
                            backgroundColor: saved ? "#10B981" : "var(--accent-blue)",
                            boxShadow: saved
                                ? "0 0 20px rgba(16, 185, 129, 0.4)"
                                : "var(--accent-blue-glow)",
                        }}
                    >
                        {saved ? (
                            <>
                                <Check className="w-4 h-4" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
