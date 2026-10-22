import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef(null);

  // Task 2: Validate the selected file
  function handleFile(selectedFile) {
    if (!selectedFile) return;

    setError("");
    setUploadedUrl("");
    setProgress(0);

    if (!ALLOWED.includes(selectedFile.type)) {
      setFile(null);
      setError("Only image files are allowed (JPEG, PNG, WebP, GIF).");
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setFile(null);
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    setFile(selectedFile);
  }

  // Task 1: Drag-and-drop handlers
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }

  // Task 3: Preview the image and clean up its URL
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Task 4: Upload with Axios and show progress
  async function upload() {
    if (!file || uploading) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setError("");
    setProgress(0);
    setUploadedUrl("");
    setUploading(true);

    try {
      const response = await apiClient.post("/api/upload", formData, {
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round(
              (event.loaded * 100) / event.total
            );
            setProgress(percent);
          }
        },
      });

      setUploadedUrl(response.data.url);
      setProgress(100);
    } catch (err) {
      setError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        className={isDragging ? "drop-zone dragging" : "drop-zone"}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>
          {isDragging
            ? "Drop to upload"
            : "Drag an image here, or click to choose"}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="error">{error}</p>}

      {preview && (
        <div>
          <p>Image preview:</p>
          <img
            src={preview}
            alt="Selected avatar preview"
            className="preview"
          />
          <p>{file?.name}</p>
        </div>
      )}

      <button onClick={upload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {uploading && (
        <div>
          <p>{progress}%</p>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {uploadedUrl && (
        <p>
          Upload successful!{" "}
          <a href={uploadedUrl} target="_blank" rel="noreferrer">
            View uploaded image
          </a>
        </p>
      )}
    </div>
  );
}