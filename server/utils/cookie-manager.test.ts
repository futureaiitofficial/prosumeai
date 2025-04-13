/**
 * Cookie Manager Tests
 * 
 * Run with: npm test -- cookie-manager
 */

import { CookieManager } from './cookie-manager';
import { Request, Response } from 'express';

// Jest types are included via tsconfig.jest.json
// No direct import needed here

describe('CookieManager', () => {
  let cookieManager: CookieManager;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    // Create a new cookie manager instance for each test
    cookieManager = new CookieManager('testapp', 'development');
    
    // Create mock request object
    mockRequest = {
      cookies: {}
    };
    
    // Create mock response object with cookie methods
    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
  });
  
  test('setCookie should call response.cookie with correct parameters', () => {
    cookieManager.setCookie(mockResponse as Response, 'test', 'value', { maxAge: 1000 });
    
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'testapp.test',
      'value',
      expect.objectContaining({
        maxAge: 1000,
        httpOnly: true,
        secure: false, // Development mode
        sameSite: 'lax'
      })
    );
  });
  
  test('setCookie should use production settings when in production mode', () => {
    // Create a production cookie manager
    const prodCookieManager = new CookieManager('testapp', 'production');
    
    prodCookieManager.setCookie(mockResponse as Response, 'test', 'value');
    
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'testapp.test',
      'value',
      expect.objectContaining({
        httpOnly: true,
        secure: true, // Production mode
        sameSite: 'strict'
      })
    );
  });
  
  test('getCookie should retrieve cookie value with correct prefix', () => {
    // Setup cookies on the request
    mockRequest.cookies = {
      'testapp.test': 'cookie-value'
    };
    
    const value = cookieManager.getCookie(mockRequest as Request, 'test');
    expect(value).toBe('cookie-value');
  });
  
  test('getCookie should return undefined for non-existent cookies', () => {
    const value = cookieManager.getCookie(mockRequest as Request, 'nonexistent');
    expect(value).toBeUndefined();
  });
  
  test('clearCookie should call response.clearCookie with correct parameters', () => {
    cookieManager.clearCookie(mockResponse as Response, 'test');
    
    expect(mockResponse.clearCookie).toHaveBeenCalledWith(
      'testapp.test',
      expect.objectContaining({
        maxAge: 0,
        expires: expect.any(Date)
      })
    );
  });
  
  test('setUserPreferences should set preferences as JSON', () => {
    const prefs = { theme: 'dark', fontSize: 'large' };
    
    cookieManager.setUserPreferences(mockResponse as Response, prefs);
    
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'testapp.preferences',
      JSON.stringify(prefs),
      expect.objectContaining({
        httpOnly: false
      })
    );
  });
  
  test('getUserPreferences should parse JSON preferences', () => {
    const prefs = { theme: 'dark', fontSize: 'large' };
    
    // Setup cookies on the request
    mockRequest.cookies = {
      'testapp.preferences': JSON.stringify(prefs)
    };
    
    const result = cookieManager.getUserPreferences(mockRequest as Request);
    expect(result).toEqual(prefs);
  });
  
  test('getUserPreferences should return null for invalid JSON', () => {
    // Setup cookies on the request with invalid JSON
    mockRequest.cookies = {
      'testapp.preferences': '{invalid-json'
    };
    
    const result = cookieManager.getUserPreferences(mockRequest as Request);
    expect(result).toBeNull();
  });
  
  test('clearAllCookies should clear all app cookies', () => {
    // Setup cookies on the request
    mockRequest.cookies = {
      'testapp.one': 'value1',
      'testapp.two': 'value2',
      'other': 'value3'
    };
    
    cookieManager.clearAllCookies(mockRequest as Request, mockResponse as Response);
    
    // Should call clearCookie twice (for the two app cookies)
    expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    
    // Check that clearCookie was called with testapp.one and testapp.two
    // The full cookie name is passed, not just the suffix
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('testapp.one', expect.any(Object));
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('testapp.two', expect.any(Object));
  });
}); 