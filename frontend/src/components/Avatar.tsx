"use client";
import { useState } from "react";
import type { AuthUser } from "@/lib/auth";

interface AvatarProps {
  user: Pick<AuthUser, "first_name" | "email" | "profile">;
  size?: number; // px
  className?: string;
  /** Overrides the fallback initial's text/background colors, e.g. "text-gold-700 bg-gold-50 text-lg" */
  fallbackClassName?: string;
}

/**
 * Shows the user's uploaded profile photo when available, falling back to
 * their initial (first name, or email) if there's no photo or it fails to load.
 */
export default function Avatar({ user, size = 28, className = "", fallbackClassName = "" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const image = user.profile?.profile_image;
  const initial = user.first_name?.[0] || user.email[0].toUpperCase();
  const dimension = `${size}px`;

  if (image && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        onError={() => setImgError(true)}
        style={{ width: dimension, height: dimension }}
        className={`rounded-full object-cover border border-gold-400/60 shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      style={{ width: dimension, height: dimension }}
      className={`rounded-full border border-gold-400/60 flex items-center justify-center font-mono shrink-0 ${
        fallbackClassName || "text-gold-300 text-[11px]"
      } ${className}`}
    >
      {initial}
    </span>
  );
}
