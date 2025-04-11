"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Play, Loader, ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function Prompt() {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [streamedText, setStreamedText] = useState<string>('');
    const [isTextStreaming, setIsTextStreaming] = useState(false);
    const [pendingText, setPendingText] = useState('');
    const [displayedText, setDisplayedText] = useState('');

    const eventSourceRef = useRef<EventSource | null>(null);

    // Format time as mm:ss
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Effect to update elapsed time while generating
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (isGenerating) {
            timer = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else if (!isGenerating && timer) {
            setElapsedTime(0);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isGenerating]);

    // Clean up event source on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    // Animation effect to display text character by character
    useEffect(() => {
        if (pendingText.length === 0) return;

        const typingInterval = setInterval(() => {
            // Take the first character from pendingText and add it to displayedText
            setDisplayedText(prev => prev + pendingText[0]);
            setPendingText(prev => prev.slice(1));
        }, 10); // Adjust speed as needed

        return () => clearInterval(typingInterval);
    }, [pendingText]);

    const startTextStreaming = (jobId: string) => {
        // Close existing connection if any
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setIsTextStreaming(true);
        setStreamedText('Connecting to text stream...');

        try {
            // Create a new EventSource connection
            const eventSource = new EventSource(`/api/prompt/text?jobId=${jobId}`);
            eventSourceRef.current = eventSource;

            // Connection opened
            eventSource.onopen = () => {
                console.log('Text stream connection established');
                setStreamedText('');
            };

            // Handle messages
            eventSource.onmessage = (event) => {
                console.log('Received SSE message:', event.data);
                try {
                    const data = JSON.parse(event.data);

                    if (data.text) {
                        // Queue the new text instead of immediately displaying it
                        setPendingText(prev => prev + data.text);
                    }

                    if (data.done) {
                        console.log('Text streaming completed');
                        eventSource.close();
                        setIsTextStreaming(false);
                    }

                    if (data.error) {
                        console.error("Text streaming error:", data.error);
                        setStreamedText(prev => `${prev}\n\nError: ${data.error}`);
                        eventSource.close();
                        setIsTextStreaming(false);
                    }
                } catch (parseError) {
                    console.error('Failed to parse SSE data:', parseError, event.data);
                    setStreamedText(prev => `${prev}\n\nError parsing stream data`);
                }
            };

            // Handle errors
            eventSource.onerror = (error) => {
                console.error("EventSource error:", error);
                setStreamedText(prev => `${prev}\n\nConnection error. Reconnecting...`);

                // Close the connection on error
                eventSource.close();

                // Attempt to reconnect after a delay
                setTimeout(() => {
                    if (isTextStreaming) {
                        console.log('Attempting to reconnect text stream');
                        startTextStreaming(jobId);
                    }
                }, 3000);
            };
        } catch (error) {
            console.error('Failed to create EventSource:', error);
            setStreamedText('Failed to connect to text stream. Please try again.');
            setIsTextStreaming(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setVideoUrl(null);
        setStreamedText('');
        setElapsedTime(0);

        try {
            // Start the job
            const response = await fetch('/api/prompt/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error(`Failed to start job: ${response.status}`);
            }

            const { jobId } = await response.json();
            console.log("Job started with ID:", jobId);

            // Start streaming text immediately
            startTextStreaming(jobId);

            // Poll for video completion
            const maxAttempts = 720; // Try for 60 minutes (720 × 5s)
            let attempts = 0;

            const pollInterval = setInterval(async () => {
                try {
                    attempts++;
                    if (attempts > maxAttempts) {
                        clearInterval(pollInterval);
                        throw new Error("Job timed out after 60 minutes");
                    }

                    const statusResponse = await fetch(`/api/prompt/status?jobId=${jobId}`);
                    if (!statusResponse.ok) {
                        throw new Error(`Error checking status: ${statusResponse.status}`);
                    }

                    const statusData = await statusResponse.json();
                    console.log("Job status:", statusData);

                    if (statusData.completed) {
                        clearInterval(pollInterval);

                        if (statusData.error) {
                            throw new Error(`Job failed: ${statusData.error}`);
                        }

                        if (statusData.video) {
                            const videoPath = statusData.video;
                            const videoResponse = await fetch(`/api/video`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ videoPath }),
                            });
                            const blob = await videoResponse.blob();
                            const url = URL.createObjectURL(blob);
                            console.log("Video URL:", url);
                            setVideoUrl(url);
                        } else {
                            throw new Error("Job completed but no video URL was provided");
                        }

                        setIsGenerating(false);
                    }
                } catch (error) {
                    clearInterval(pollInterval);
                    console.error("Polling error:", error);
                    setIsGenerating(false);
                }
            }, 5000); // Poll every 5 seconds

        } catch (error) {
            console.error("Failed to send prompt:", error);
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
            <div className="h-full flex flex-col md:flex-row">
                {/* Left Side - Input Form */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col h-full relative">
                    <h1 className="text-4xl font-bold mb-6 font-queensides flex-shrink-0">Create Your Prompt</h1>

                    <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pb-20">
                        {/* Prompt Text Area */}
                        <div>
                            <label htmlFor="prompt" className="block text-2xl font-queensides mb-2">
                                What would you like to explore about Singapore&apos;s history?
                            </label>
                            <Textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter your prompt here..."
                                className="w-full h-28 bg-gray-800 border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isGenerating || !prompt.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:bg-blue-800 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        Generating
                                        <Loader className="w-4 h-4 animate-spin" />
                                    </>
                                ) : (
                                    <>
                                        Generate
                                        <Send size={16} />
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Text Generation Output */}
                        {(displayedText || isTextStreaming) && (
                            <div className="mt-8">
                                <h3 className="text-xl font-queensides mb-3">Historical Context</h3>
                                <div className="bg-gray-800 rounded-lg p-4 max-h-100 overflow-y-auto">
                                    <p className="text-gray-200 whitespace-pre-wrap">
                                        {displayedText}
                                        {isTextStreaming && (
                                            <span className="inline-block animate-pulse">▌</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Back to Home Button - Bottom Left */}
                    <div className="absolute bottom-6 left-6 z-10">
                        <Link href="/" className="flex items-center justify-center">
                            <Button
                                variant="outline"
                                style={{ cursor: "pointer" }}
                                size="lg"
                                className="footer-menu-font !text-black !text-lg bg-gradient-to-r from-white/80 to-slate-200/90 hover:from-white hover:to-slate-300 text-slate-800 border border-slate-200 shadow-md rounded-full px-8 py-6 text-xl font-queensides"
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Right Side - Video Result */}
                <div className="w-full md:w-1/2 bg-gray-950 p-6 flex flex-col border-l border-gray-700 h-full overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4 font-queensides flex-shrink-0">Generated Video</h2>

                    <div className="flex-grow flex flex-col items-center justify-center">
                        {/* Changed from aspect-[9/16] to aspect-video for 16:9 rectangular format */}
                        <div className="w-full max-w-2xl aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                            {/* Video or Loading State */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {videoUrl ? (
                                    <video
                                        className="w-full h-full object-contain"
                                        controls
                                        autoPlay
                                        loop
                                        src={videoUrl}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                ) : isGenerating ? (
                                    <div className="text-center">
                                        <Loader className="w-12 h-12 animate-spin mb-4 mx-auto text-blue-500" />
                                        <p className="text-gray-400">Generating your video...</p>
                                        <p className="text-xs text-gray-500 mt-2">This might take a minute</p>
                                        <p className="text-xs font-mono text-blue-400 mt-1">
                                            Time elapsed: {formatTime(elapsedTime)}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center mx-auto mb-4 border border-gray-700">
                                            <Play className="w-8 h-8 text-gray-400 ml-1" />
                                        </div>
                                        <p className="text-gray-400">Your video will appear here</p>
                                        <p className="text-xs text-gray-500 mt-2">Fill out the form and click Generate</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress bar based on elapsed time */}
                        {isGenerating && (
                            <div className="mt-6 w-full max-w-2xl">
                                <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
                                    <span>Processing...</span>
                                    <span>{formatTime(elapsedTime)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-800 rounded-full">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(elapsedTime / 900 * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}