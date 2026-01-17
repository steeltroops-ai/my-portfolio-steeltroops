import { useState } from "react";
import PropTypes from "prop-types";
import {
  FaXTwitter,
  FaLinkedinIn,
  FaFacebookF,
  FaRedditAlien,
} from "react-icons/fa6";
import { FiShare2, FiCopy, FiCheck } from "react-icons/fi";

const SocialShare = ({
  url = window.location.href,
  title = "",
  description = "",
  className = "",
  showLabels = false,
  size = "md", // sm, md, lg
}) => {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const shareData = {
    url: encodeURIComponent(url),
    title: encodeURIComponent(title),
    description: encodeURIComponent(description),
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareData.title}&url=${shareData.url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareData.url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareData.url}`,
    reddit: `https://reddit.com/submit?url=${shareData.url}&title=${shareData.title}`,
  };

  const platforms = [
    {
      name: "Twitter",
      icon: FaXTwitter,
      url: shareLinks.twitter,
      color: "hover:text-blue-400",
      bgColor: "hover:bg-blue-400/10",
    },
    {
      name: "LinkedIn",
      icon: FaLinkedinIn,
      url: shareLinks.linkedin,
      color: "hover:text-blue-600",
      bgColor: "hover:bg-blue-600/10",
    },
    {
      name: "Facebook",
      icon: FaFacebookF,
      url: shareLinks.facebook,
      color: "hover:text-blue-500",
      bgColor: "hover:bg-blue-500/10",
    },
    {
      name: "Reddit",
      icon: FaRedditAlien,
      url: shareLinks.reddit,
      color: "hover:text-orange-500",
      bgColor: "hover:bg-orange-500/10",
    },
  ];

  const sizeClasses = {
    sm: "p-2 text-sm",
    md: "p-3 text-base",
    lg: "p-4 text-lg",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleShare = (platform) => {
    const shareUrl = shareLinks[platform];
    if (shareUrl) {
      window.open(
        shareUrl,
        "_blank",
        "width=600,height=400,scrollbars=yes,resizable=yes"
      );
    }
    setShowDropdown(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowDropdown(false);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        setShowDropdown(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main Share Button */}
      <button
        onClick={handleNativeShare}
        className={`
          flex items-center gap-2 ${sizeClasses[size]} 
          bg-neutral-800 hover:bg-neutral-700 
          text-neutral-300 hover:text-white 
          rounded-lg transition-colors
        `}
        title="Share this post"
      >
        <FiShare2 className={iconSizeClasses[size]} />
        {showLabels && <span>Share</span>}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-2 z-20 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl min-w-48">
            <div className="p-2">
              <div className="text-xs text-neutral-400 px-2 py-1 mb-2">
                Share this post
              </div>

              {/* Social Platform Buttons */}
              {platforms.map((platform) => {
                const IconComponent = platform.icon;
                return (
                  <button
                    key={platform.name}
                    onClick={() => handleShare(platform.name.toLowerCase())}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 
                      text-neutral-300 ${platform.color} ${platform.bgColor}
                      rounded transition-colors text-left
                    `}
                  >
                    <IconComponent className={iconSizeClasses[size]} />
                    <span>Share on {platform.name}</span>
                  </button>
                );
              })}

              {/* Copy Link Button */}
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 px-3 py-2 text-neutral-300 hover:text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors text-left"
              >
                {copied ? (
                  <FiCheck
                    className={`${iconSizeClasses[size]} text-green-400`}
                  />
                ) : (
                  <FiCopy className={iconSizeClasses[size]} />
                )}
                <span>{copied ? "Copied!" : "Copy link"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

SocialShare.propTypes = {
  url: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
  showLabels: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
};

// Inline Social Share Buttons (for article footers)
export const InlineSocialShare = ({
  url = window.location.href,
  title = "",
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const shareData = {
    url: encodeURIComponent(url),
    title: encodeURIComponent(title),
  };

  const platforms = [
    {
      name: "Twitter",
      icon: FaXTwitter,
      url: `https://twitter.com/intent/tweet?text=${shareData.title}&url=${shareData.url}`,
      color: "hover:text-blue-400 hover:bg-blue-400/10",
    },
    {
      name: "LinkedIn",
      icon: FaLinkedinIn,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareData.url}`,
      color: "hover:text-blue-600 hover:bg-blue-600/10",
    },
    {
      name: "Facebook",
      icon: FaFacebookF,
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareData.url}`,
      color: "hover:text-blue-500 hover:bg-blue-500/10",
    },
  ];

  const handleShare = (shareUrl) => {
    window.open(
      shareUrl,
      "_blank",
      "width=600,height=400,scrollbars=yes,resizable=yes"
    );
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {platforms.map((platform) => {
        const IconComponent = platform.icon;
        return (
          <button
            key={platform.name}
            onClick={() => handleShare(platform.url)}
            className={`p-2 rounded-full text-neutral-400 transition-colors ${platform.color}`}
            title={`Share on ${platform.name}`}
          >
            <IconComponent className="w-5 h-5" />
          </button>
        );
      })}

      <button
        onClick={copyToClipboard}
        className="p-2 rounded-full text-neutral-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
        title="Copy link"
      >
        {copied ? (
          <FiCheck className="w-5 h-5 text-green-400" />
        ) : (
          <FiCopy className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

InlineSocialShare.propTypes = {
  url: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
};

export default SocialShare;
