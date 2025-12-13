// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";

// dayjs.extend(relativeTime);

// export function fromNow(strDate: string | Date): string {
//   return dayjs().to(dayjs(strDate));
// }

export const fromNow = (date: string): string => {
  const now = new Date()
  const past = new Date(date)
  const diffInDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays < 30) return `${diffInDays} 天前`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} 个月前`
  return `${Math.floor(diffInDays / 365)} 年前`
}

// 格式化日期
export const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getAssetUrl = (assetId?: string | null) => {
  if (assetId) {
    if (assetId.startsWith("http")) {
      return assetId;
    } else {
      return `/api/assets/${assetId}`;
    }
  }
  return "/placeholder.svg";
}

export const formatNumber = (number: number | string | null) => {
  if (number) {
    return number.toLocaleString("zh-CN", {
      maximumFractionDigits: 2,
    });
  }
  return "0"
}


// This is a mock implementation for demonstration purposes
// In a real app, you would integrate with your authentication provider

/**
 * Sends a verification code to the provided phone number
 */
export async function sendVerificationCode(phone: string): Promise<void> {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Verification code sent to ${phone}`)
      resolve()
    }, 1000)
  })
}

/**
 * Verifies the code sent to the provided phone number
 */
export async function verifyPhoneCode(phone: string, code: string): Promise<void> {
  // Simulate API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // For demo purposes, any code "123456" is valid
      if (code === "123456") {
        console.log(`Phone ${phone} verified with code ${code}`)
        resolve()
      } else {
        reject(new Error("Invalid verification code"))
      }
    }, 1000)
  })
}

/**
 * Sends an OTP code to the provided email address
 */
export async function sendEmailOTP(email: string): Promise<void> {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`OTP code sent to ${email}`)
      resolve()
    }, 1000)
  })
}

/**
 * Verifies the OTP code sent to the provided email address
 */
export async function verifyEmailOTP(email: string, otp: string): Promise<void> {
  // Simulate API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // For demo purposes, any code "123456" is valid
      if (otp === "123456") {
        console.log(`Email ${email} verified with OTP ${otp}`)
        resolve()
      } else {
        reject(new Error("Invalid OTP code"))
      }
    }, 1000)
  })
}

/**
 * Checks if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  // In a real app, you would check the session/token
  return false
}

/**
 * Signs the user out
 */
export async function signOut(): Promise<void> {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("User signed out")
      resolve()
    }, 500)
  })
}

/**
 * 上传文件到阿里云OSS（带进度跟踪）
 */
export interface OSSUploadResult {
  success: boolean;
  assetId?: string;
  url?: string;
  error?: string;
}

export interface OSSUploadOptions {
  onProgress?: (progress: number) => void;
  assetType?: string;
}

export async function uploadToOSS(
  file: File,
  assetType?: string,
  options?: OSSUploadOptions
): Promise<OSSUploadResult> {
  try {
    // 第一步：获取OSS临时上传凭证
    const credentialResponse = await fetch("/api/assets/oss", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        assetType,
      }),
    });

    if (!credentialResponse.ok) {
      const errorData = await credentialResponse.json();
      throw new Error(errorData.error || "获取上传凭证失败");
    }

    const credentialData = await credentialResponse.json();
    const { uploadUrl, assetId } = credentialData;

    // 第二步：直接上传文件到OSS（带进度跟踪）
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("文件上传到OSS失败");
    }

    // 第三步：调用回调接口通知服务器上传完成
    const callbackUrl = new URL("/api/assets/oss", window.location.origin);
    callbackUrl.searchParams.set("assetId", assetId);
    callbackUrl.searchParams.set("url", uploadUrl.split("?")[0]); // 获取不带参数的URL
    callbackUrl.searchParams.set("size", file.size.toString());
    callbackUrl.searchParams.set("mimeType", file.type);

    const callbackResponse = await fetch(callbackUrl.toString(), {
      method: "GET",
    });

    if (!callbackResponse.ok) {
      console.warn("回调通知失败，但文件已上传成功");
    }

    return {
      success: true,
      assetId,
      url: uploadUrl.split("?")[0], // 返回不带参数的URL
    };
  } catch (error) {
    console.error("OSS上传失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "上传失败",
    };
  }
}

/**
 * 带进度跟踪的OSS上传（使用XMLHttpRequest）
 */
export function uploadToOSSWithProgress(
  file: File,
  assetType?: string,
  onProgress?: (progress: number) => void
): Promise<OSSUploadResult> {
  return new Promise(async (resolve) => {
    try {
      // 第一步：获取OSS临时上传凭证
      const credentialResponse = await fetch("/api/assets/oss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          assetType,
        }),
      });

      if (!credentialResponse.ok) {
        const errorData = await credentialResponse.json();
        throw new Error(errorData.error || "获取上传凭证失败");
      }

      const credentialData = await credentialResponse.json();
      const { uploadUrl, assetId } = credentialData;

      // 第二步：使用XMLHttpRequest上传文件到OSS（带进度跟踪）
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // 第三步：调用回调接口通知服务器上传完成
            const callbackUrl = new URL("/api/assets/oss", window.location.origin);
            callbackUrl.searchParams.set("assetId", assetId);
            callbackUrl.searchParams.set("url", uploadUrl.split("?")[0]);
            callbackUrl.searchParams.set("size", file.size.toString());
            callbackUrl.searchParams.set("mimeType", file.type);

            const callbackResponse = await fetch(callbackUrl.toString(), {
              method: "GET",
            });

            if (!callbackResponse.ok) {
              console.warn("回调通知失败，但文件已上传成功");
            }

            resolve({
              success: true,
              assetId,
              url: uploadUrl.split("?")[0],
            });
          } catch (error) {
            console.warn("回调通知失败，但文件已上传成功");
            resolve({
              success: true,
              assetId,
              url: uploadUrl.split("?")[0],
            });
          }
        } else {
          resolve({
            success: false,
            error: `上传失败: ${xhr.status}`,
          });
        }
      });

      xhr.addEventListener("error", () => {
        resolve({
          success: false,
          error: "网络错误",
        });
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : "上传失败",
      });
    }
  });
}

/**
 * 获取OSS文件的完整URL
 */
export function getOSSFileUrl(ossFileName: string): string {
  const bucket = process.env.NEXT_PUBLIC_ALIYUN_OSS_BUCKET;
  const region = process.env.NEXT_PUBLIC_ALIYUN_OSS_REGION || "oss-cn-hangzhou";
  return `https://${bucket}.${region}.aliyuncs.com/${ossFileName}`;
}

/**
 * Save form data to localStorage for later restoration
 */
export function saveFormData(formData: Record<string, any>, key: string = 'submit-form-data') {
  try {
    localStorage.setItem(key, JSON.stringify({
      data: formData,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('Failed to save form data:', error)
  }
}

/**
 * Get saved form data from localStorage
 */
export function getFormData(key: string = 'submit-form-data'): Record<string, any> | null {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return null

    const parsed = JSON.parse(saved)
    const { data, timestamp } = parsed

    // 检查数据是否过期（24小时）
    const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000
    if (isExpired) {
      localStorage.removeItem(key)
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get form data:', error)
    return null
  }
}

/**
 * Clear saved form data from localStorage
 */
export function clearFormData(key: string = 'submit-form-data') {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear form data:', error)
  }
}

/**
 * R2 上传结果接口
 */
export interface R2UploadResult {
  success: boolean;
  assetId?: string;
  url?: string;
  error?: string;
}

/**
 * 上传文件到 Cloudflare R2
 */
export async function uploadToR2(
  file: File,
  assetType?: string
): Promise<R2UploadResult> {
  try {
    // 第一步：获取R2预签名上传URL
    const credentialResponse = await fetch("/api/assets/r2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        assetType,
      }),
    });

    if (!credentialResponse.ok) {
      const errorData = await credentialResponse.json();
      throw new Error(errorData.error || "获取上传凭证失败");
    }

    const credentialData = await credentialResponse.json();
    const { uploadUrl, assetId, publicUrl } = credentialData;

    // 第二步：直接上传文件到R2
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("文件上传到R2失败");
    }

    return {
      success: true,
      assetId,
      url: publicUrl,
    };
  } catch (error) {
    console.error("R2上传失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "上传失败",
    };
  }
}

/**
 * 带进度跟踪的R2上传（使用XMLHttpRequest）
 */
export function uploadToR2WithProgress(
  file: File,
  assetType?: string,
  onProgress?: (progress: number) => void
): Promise<R2UploadResult> {
  return new Promise(async (resolve) => {
    try {
      // 第一步：获取R2预签名上传URL
      const credentialResponse = await fetch("/api/assets/r2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          assetType,
        }),
      });

      if (!credentialResponse.ok) {
        const errorData = await credentialResponse.json();
        throw new Error(errorData.error || "获取上传凭证失败");
      }

      const credentialData = await credentialResponse.json();
      const { uploadUrl, assetId, publicUrl } = credentialData;

      // 第二步：使用XMLHttpRequest上传文件到R2（带进度跟踪）
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            assetId,
            url: publicUrl,
          });
        } else {
          resolve({
            success: false,
            error: `上传失败: ${xhr.status}`,
          });
        }
      });

      xhr.addEventListener("error", () => {
        resolve({
          success: false,
          error: "网络错误",
        });
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : "上传失败",
      });
    }
  });
}

