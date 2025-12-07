"use client";
import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

export default function FileUploader() {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [message, setMessage] = useState<string>("");
    const router = useRouter();

    const handleUpload = async (): Promise<void> => {
        if (!file) return;

        setMessage("Requesting upload URL...");
        try {
            // 1. Get signed URL and imageId
            const res = await fetch("/api/uploadUrl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: file.name, fileType: file.type }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to get URL");

            const { uploadUrl, imageId, userId } = data; // userId + imageId from server
            setMessage("Uploading...");

            // 2. Upload file directly to S3
            await axios.put(uploadUrl, file, {
                headers: {
                    "Content-Type": file.type,
                    // These become S3 object metadata:
                    "x-amz-meta-userid": userId,
                    "x-amz-meta-imageid": imageId,
                },
                onUploadProgress: (evt) => {
                    if (evt.total) {
                        setProgress(Math.round((evt.loaded / evt.total) * 100));
                    }
                },
            });

            setMessage("Upload complete! Processing in background...");
            // Optionally, refresh images list:
            router.refresh();
        } catch (err) {
            console.error(err);
            setMessage("Upload failed. Check console.");
        }
    };

    return (
        <div className="p-4 border rounded shadow max-w-md">
            <h2 className="text-lg font-semibold">Upload an Image</h2>
            <div className="mt-2">
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        setFile(e.target.files ? e.target.files[0] : null);
                        setProgress(0);
                        setMessage("");
                    }}
                />
                {file && (
                    <Button className="mt-2" onClick={handleUpload}>
                        Upload
                    </Button>
                )}
            </div>
            {progress > 0 && (
                <div className="mt-2">
                    <Progress value={progress} max={100}>
                        {progress}%
                    </Progress>
                </div>
            )}
            {message && <p className="mt-2 italic">{message}</p>}
        </div>
    );
} 