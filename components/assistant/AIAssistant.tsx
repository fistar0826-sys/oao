
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AssetAccount, CashflowRecord, Budget, Goal, ChatMessage } from '../../types';

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    assetAccounts: AssetAccount[];
    cashflowRecords: CashflowRecord[];
    budgets: Budget[];
    goals: Goal[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, assetAccounts, cashflowRecords, budgets, goals }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            if (messages.length === 0) {
                 setMessages([{ role: 'model', content: '你好！我是您的個人財務助理 Navi。請問有什麼可以為您服務的嗎？例如，您可以問我「我上個月的花費狀況如何？」或「我該如何更快達成我的儲蓄目標？」' }]);
            }
        }
    }, [isOpen, messages.length]);
    
    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const summarizeFinancialData = (): string => {
        const totalAssets = assetAccounts.reduce((sum, acc) => sum + (acc.assets || []).reduce((s, asset) => s + (asset.currentValueTWD || 0), 0), 0);
        const lastMonthRecords = cashflowRecords.filter(r => {
            const recordDate = new Date(r.date);
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            return recordDate >= lastMonth && recordDate < new Date(today.getFullYear(), today.getMonth(), 1);
        });
        const lastMonthIncome = lastMonthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
        const lastMonthExpense = lastMonthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);

        const summary = {
            totalAssets: totalAssets.toFixed(0),
            lastMonthIncome: lastMonthIncome.toFixed(0),
            lastMonthExpense: lastMonthExpense.toFixed(0),
            goals: goals.map(g => ({ name: g.name, progress: `${((g.currentAmount/g.targetAmount)*100).toFixed(1)}%` })),
        };
        return JSON.stringify(summary);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        
        // FIX: Per guidelines, API key must come exclusively from process.env.API_KEY.
        // This check ensures the app provides a graceful message if the key is not configured.
        if (!process.env.API_KEY) {
            setTimeout(() => {
                const simulatedResponse: ChatMessage = { role: 'model', content: 'AI 助理未設定 API 金鑰，目前無法使用。' };
                setMessages(prev => [...prev, simulatedResponse]);
                setIsLoading(false);
            }, 500);
            return;
        }

        try {
            // FIX: Per guidelines, initialize with apiKey from process.env and call models.generateContent.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const financialContext = summarizeFinancialData();
            const systemInstruction = `You are a helpful and insightful personal finance assistant for the 'Personal Finance Navigator' app. Your name is 'Navi'. You must respond in Traditional Chinese (繁體中文). Analyze the user's financial data to provide personalized advice, answer questions, and help with goals. Be encouraging, clear, and format your responses with markdown for better readability. Here is the user's data summary: \n${financialContext}`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: input,
              config: {
                systemInstruction: systemInstruction,
              }
            });

            // FIX: Per guidelines, access the response text directly via the .text property.
            const aiResponse: ChatMessage = { role: 'model', content: response.text };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error("AI Assistant Error:", error);
            const errorMessage: ChatMessage = { role: 'model', content: '抱歉，我現在無法回答。請稍後再試。' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-full max-w-md h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 ease-in-out transform origin-bottom-right">
            <header className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-2xl shadow-md">
                <h3 className="text-lg font-bold">AI 財務助理</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Close chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl shadow ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl shadow bg-gray-200 text-gray-800">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                <div className="flex items-center space-x-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="請在這裡輸入您的問題..."
                        className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                        autoComplete="off"
                    />
                    <button type="submit" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow" disabled={isLoading || !input.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIAssistant;
