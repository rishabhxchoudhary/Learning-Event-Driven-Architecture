'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoginButton from "@/components/LoginButton";
import FileUploader from "@/components/FileUploader";

interface ImageItem {
  imageId: string;
  originalKey: string;
  originalFileName?: string;
  thumb200Key?: string | null;
  thumb400Key?: string | null;
  thumb200Url?: string;
  thumb400Url?: string;
  status: string;
  createdAt?: number;
}

export default function HomePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = async () => {
    if (!session) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/images");
      if (!res.ok) {
        throw new Error(`Failed to load images (${res.status})`);
      }
      const data = await res.json();
      setImages(data.images || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      void loadImages();
    } else {
      setImages([]);
    }
  }, [session]);

  return (
    <main className="p-8 font-sans space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Image Upload & Resize Demo</h1>
          <p className="text-sm text-gray-500">
            Upload an image, then Lambda creates 200px & 400px thumbnails in the background.
          </p>
        </div>
        <LoginButton />
      </header>

      {sessionStatus === "loading" && (
        <p className="text-sm text-gray-500">Checking session…</p>
      )}

      {!session && sessionStatus !== "loading" && (
        <p>
          Please sign in to upload and view your images.
        </p>
      )}

      {session && (
        <>
          <p className="text-sm">
            Signed in as{" "}
            <span className="font-medium">{session.user?.email}</span>
          </p>

          <section>
            <FileUploader />
            <button
              type="button"
              onClick={loadImages}
              className="mt-3 text-sm underline hover:no-underline"
            >
              Refresh images
            </button>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Your Images</h2>
              {loading && (
                <span className="text-sm text-gray-500">Loading…</span>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-2">
                {error}
              </p>
            )}

            {images.length === 0 && !loading && (
              <p className="text-sm text-gray-500">
                You don&apos;t have any images yet. Try uploading one above.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {images.map((img) => (
                <div key={img.imageId} className="border rounded p-4 space-y-2">
                  <p className="font-medium truncate">
                    {img.originalFileName ??
                      img.originalKey?.split("/").pop()}
                  </p>

                  <p className="text-xs text-gray-500">
                    Status: <span className="font-mono">{img.status}</span>
                  </p>

                  {img.status === "done" ? (
                    <>
                      {img.thumb200Url && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            200px thumbnail
                          </p>
                          <img
                            src={img.thumb200Url}
                            alt="200px thumbnail"
                            className="mt-1 rounded border max-w-full"
                          />
                        </div>
                      )}

                      {img.thumb400Url && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            400px thumbnail
                          </p>
                          <img
                            src={img.thumb400Url}
                            alt="400px thumbnail"
                            className="mt-1 rounded border max-w-full"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="italic text-sm text-gray-500">
                      Processing… refresh in a moment.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}