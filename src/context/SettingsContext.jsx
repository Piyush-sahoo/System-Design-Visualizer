import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    // Initialize state from localStorage or defaults
    const [provider, setProvider] = useState(() => {
        return localStorage.getItem("app_provider") || "openai";
    });

    const [apiKey, setApiKey] = useState(() => {
        return localStorage.getItem("app_api_key") || "";
    });

    const [model, setModel] = useState(() => {
        return localStorage.getItem("app_model") || "";
    });

    // Update localStorage when state changes
    useEffect(() => {
        localStorage.setItem("app_provider", provider);
    }, [provider]);

    useEffect(() => {
        localStorage.setItem("app_api_key", apiKey);
    }, [apiKey]);

    useEffect(() => {
        localStorage.setItem("app_model", model);
    }, [model]);

    const value = {
        provider,
        setProvider,
        apiKey,
        setApiKey,
        model,
        setModel
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
