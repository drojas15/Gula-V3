/**
 * USER MODEL
 * 
 * Database model for User entity
 */

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  weight?: number;
  goals?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  age: number;
  sex: 'M' | 'F';
  weight?: number;
  goals?: string;
}

export interface UpdateUserInput {
  name?: string;
  age?: number;
  sex?: 'M' | 'F';
  weight?: number;
  goals?: string;
}

