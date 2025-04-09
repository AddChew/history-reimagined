"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Send, Play, Loader, ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function Prompt() {
    const [prompt, setPrompt] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles]);
            
            // Generate previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        // Simulate API call
        setTimeout(() => {
            setIsGenerating(false);
        }, 3000);
        
        console.log("Prompt:", prompt);
        console.log("Images:", images);
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
                                What would you like to explore about Singapore's history?
                            </label>
                            <Textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter your prompt here..."
                                className="w-full h-28 bg-gray-800 border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        {/* Image Upload Area */}
                        <div className="space-y-3">
                            <label className="block text-2xl font-queensides mb-2">
                                Upload Images (Optional)
                            </label>
                            
                            {/* Image Preview Grid */}
                            {previews.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                                    {previews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-700">
                                                <Image 
                                                    src={preview} 
                                                    alt={`Preview ${index}`} 
                                                    width={200} 
                                                    height={200}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-black/70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Upload Button */}
                            <div className="flex items-center justify-center w-full">
                                <label
                                    htmlFor="image-upload"
                                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-800 bg-gray-900 transition-colors"
                                >
                                    <div className="flex flex-col items-center justify-center pt-3 pb-3">
                                        <Upload className="w-6 h-6 mb-2 text-gray-400" />
                                        <p className="mb-1 text-sm text-gray-400">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                    </div>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
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
                
                {/* Right Side - Video Skeleton */}
                <div className="w-full md:w-1/2 bg-gray-950 p-6 flex flex-col border-l border-gray-700 h-full overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4 font-queensides flex-shrink-0">Generated Video</h2>
                    
                    <div className="flex-grow flex flex-col items-center justify-center">
                        <div className="w-full max-w-md aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden relative">
                            {/* Video Skeleton */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {isGenerating ? (
                                    <div className="text-center">
                                        <Loader className="w-12 h-12 animate-spin mb-4 mx-auto text-blue-500" />
                                        <p className="text-gray-400">Generating your TikTok video...</p>
                                        <p className="text-xs text-gray-500 mt-2">This might take a minute</p>
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
                            
                            {/* Video Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                                <div className="space-y-2">
                                    <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse"></div>
                                    <div className="h-3 w-1/2 bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Video Controls Skeleton */}
                        <div className="mt-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-4 w-24 bg-gray-700 rounded"></div>
                                <div className="h-4 w-16 bg-gray-700 rounded"></div>
                            </div>
                            <div className="h-2 w-full bg-gray-700 rounded-full mb-6">
                                <div className={`h-full ${isGenerating ? 'w-1/3 animate-pulse' : 'w-0'} bg-blue-500 rounded-full`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}