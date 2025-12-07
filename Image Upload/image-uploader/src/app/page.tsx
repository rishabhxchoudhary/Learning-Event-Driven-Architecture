'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoginButton from "@/components/LoginButton";
import FileUploader from "@/components/FileUploader";
interface Image {
  imageId: string;
  originalKey: string;
  thumb200Key: string;
  status: string;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    if (session) {
      fetch("/api/images")
        .then(res => res.json())
        .then(data => setImages(data.images));
    }
  }, [session]);

  return (
    <main className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Image Upload & Resize Demo</h1>
      
      {!session && (
        <p>
          Please <LoginButton /> to upload images.
        </p>
      )}
      
      {session && (
        <>
          <p>Signed in as {session.user?.email} <LoginButton /></p>
          
          <FileUploader />
          
          <h2 className="mt-8 text-xl font-semibold">Your Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {images.map((img) => (
              <div key={img.imageId} className="border rounded p-4">
                <p className="font-medium">{img.originalKey.split("/").pop()}</p>
                {img.status === "done" ? (
                  <img
                    src={`https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${img.thumb200Key}`}
                    alt="Thumbnail"
                    className="mt-2"
                  />
                ) : (
                  <p className="italic">Processing...</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}