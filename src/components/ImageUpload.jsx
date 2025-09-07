import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { uploadImage, processImage } from "../services/SupabaseStorageService";
import { FiUpload, FiX } from "react-icons/fi";

const ImageUpload = ({
  onImageUploaded,
  folder = "content",
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB
  className = "",
  showPreview = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    setError("");
    setUploading(true);

    try {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          setError(`${file.name} is not an image file`);
          return false;
        }

        // Validate file size
        if (file.size > maxSize) {
          setError(
            `${file.name} is too large. Maximum size is ${
              maxSize / (1024 * 1024)
            }MB`
          );
          return false;
        }

        return true;
      });

      if (validFiles.length === 0) {
        setUploading(false);
        return;
      }

      const uploadPromises = validFiles.map(async (file) => {
        try {
          // Process image (resize and compress)
          const processedFile = await processImage(file, {
            maxWidth: 1200,
            maxHeight: 800,
            quality: 0.8,
          });

          // Upload to Supabase
          const result = await uploadImage(processedFile, folder);

          if (result.error) {
            throw result.error;
          }

          return {
            name: file.name,
            url: result.data.publicUrl,
            path: result.data.path,
            size: processedFile.size,
          };
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          throw error;
        }
      });

      const results = await Promise.all(uploadPromises);

      if (showPreview) {
        setUploadedImages((prev) => [...prev, ...results]);
      }

      // Call the callback with uploaded image data
      if (onImageUploaded) {
        if (multiple) {
          onImageUploaded(results);
        } else {
          onImageUploaded(results[0]);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`image-upload ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${
            dragActive
              ? "border-cyan-400 bg-cyan-400/10"
              : "border-neutral-600 hover:border-neutral-500"
          }
          ${uploading ? "pointer-events-none opacity-50" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-2">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <p className="text-sm text-neutral-400">Uploading...</p>
            </>
          ) : (
            <>
              <FiUpload className="h-8 w-8 text-neutral-400" />
              <p className="text-sm text-neutral-300">
                {dragActive
                  ? "Drop images here"
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-neutral-500">
                PNG, JPG, WebP up to {maxSize / (1024 * 1024)}MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Preview Grid */}
      {showPreview && uploadedImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-neutral-300 mb-2">
            Uploaded Images
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Info Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-between p-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="self-end p-1 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                  >
                    <FiX className="h-3 w-3 text-white" />
                  </button>

                  <div className="text-xs text-white">
                    <p className="truncate">{image.name}</p>
                    <p>{(image.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                {/* Copy URL Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(image.url);
                  }}
                  className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-2 py-1 rounded"
                >
                  Copy URL
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {uploadedImages.length > 0 && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              const urls = uploadedImages.map((img) => img.url).join("\n");
              navigator.clipboard.writeText(urls);
            }}
            className="text-xs px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded transition-colors"
          >
            Copy All URLs
          </button>

          <button
            onClick={() => setUploadedImages([])}
            className="text-xs px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

ImageUpload.propTypes = {
  onImageUploaded: PropTypes.func.isRequired,
  folder: PropTypes.string,
  multiple: PropTypes.bool,
  maxSize: PropTypes.number,
  className: PropTypes.string,
  showPreview: PropTypes.bool,
};

export default ImageUpload;
