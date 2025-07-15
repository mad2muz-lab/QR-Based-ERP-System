export class SecurityUtils {
  // Input sanitization
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number (basic validation)
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Validate QR code format
  static isValidQRCode(qrCode: string): boolean {
    if (!qrCode || typeof qrCode !== 'string') return false;
    
    // Check for valid QR code patterns
    const validPatterns = [
      /^EMP-\d+$/, // Employee pattern
      /^EQ-[A-Z0-9-]+$/, // Equipment pattern
      /^MAT-\d+$/, // Material pattern
      /^SITE-\d+$/ // Site pattern
    ];
    
    return validPatterns.some(pattern => pattern.test(qrCode));
  }

  // Validate custom equipment ID
  static isValidCustomEquipmentId(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    
    // 1-10 characters, uppercase letters, numbers, and dashes only
    const validPattern = /^[A-Z0-9-]{1,10}$/;
    return validPattern.test(id);
  }

  // Password strength validation
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number; // 0-4
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score++;
    }

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Include at least one lowercase letter');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Include at least one uppercase letter');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('Include at least one number');

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('Include at least one special character');

    return {
      isValid: score >= 3 && password.length >= 8,
      score,
      feedback
    };
  }

  // Rate limiting for API calls
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  // Secure token generation
  static generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Data encryption (basic implementation)
  static async encryptData(data: string, key: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate a key from the password
      const keyBuffer = encoder.encode(key);
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encrypted.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Data decryption
  static async decryptData(encryptedData: string, key: string): Promise<string> {
    try {
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      
      // Decode from base64
      const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // Extract IV and encrypted data
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);
      
      // Generate key
      const keyBuffer = encoder.encode(key);
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encrypted
      );

      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // XSS prevention
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // CSRF token generation
  static generateCSRFToken(): string {
    return this.generateSecureToken();
  }

  // Validate CSRF token
  static validateCSRFToken(token: string, storedToken: string): boolean {
    return token === storedToken && token.length > 0;
  }
} 