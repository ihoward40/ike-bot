// Memory System - Real file-based storage

import fs from 'fs';
import path from 'path';
import { SintraEvent } from './types';

export class MemorySystem {
  private memoryDir: string;
  private events: SintraEvent[] = [];
  private maxEvents: number = 1000;

  constructor(memoryDir?: string) {
    this.memoryDir = memoryDir || path.join(process.cwd(), 'memory');
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  recordEvent(event: SintraEvent): void {
    this.events.push(event);
    
    // Keep only last maxEvents in memory
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Write to file
    this.persistEvent(event);
  }

  private persistEvent(event: SintraEvent): void {
    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(this.memoryDir, `events_${date}.jsonl`);
    
    const line = JSON.stringify({
      ...event,
      timestamp: event.timestamp.toISOString()
    }) + '\n';
    
    fs.appendFileSync(filename, line, 'utf8');
  }

  getRecentEvents(count: number = 10): SintraEvent[] {
    return this.events.slice(-count);
  }

  getAllEvents(): SintraEvent[] {
    return [...this.events];
  }

  writeLastWords(error: Error): void {
    const lastWordsPath = path.join(this.memoryDir, 'last_words.json');
    const lastWords = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      events: this.getRecentEvents(5)
    };
    
    fs.writeFileSync(lastWordsPath, JSON.stringify(lastWords, null, 2), 'utf8');
  }

  // Load events from today's file
  loadTodaysEvents(): void {
    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(this.memoryDir, `events_${date}.jsonl`);
    
    if (!fs.existsSync(filename)) {
      return;
    }

    try {
      const content = fs.readFileSync(filename, 'utf8');
      const lines = content.trim().split('\n');
      
      this.events = lines.map(line => {
        const parsed = JSON.parse(line);
        return {
          ...parsed,
          timestamp: new Date(parsed.timestamp)
        };
      });
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }
}
