"use client"

import React from 'react'
import { ThemeSettings, CompactThemeSettings } from '@/components/theme-settings'
import { ThemeToggle, HeaderThemeToggle, SidebarThemeToggle, CoffeeThemeToggle } from '@/components/theme-toggle'
import { useTheme } from '@/context/theme-context'
import Link from 'next/link'

export default function ThemeDemoPage() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground brand-font">Prime Addis Theme Demo</h1>
            <p className="text-muted-foreground">Experience our light and dark themes</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSettings />
            <Link 
              href="/"
              className="px-4 py-2 bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Current Theme Info */}
        <div className="card-base">
          <h2 className="text-2xl font-semibold mb-4">Current Theme: {theme === 'light' ? 'Light Mode' : 'Dark Mode'}</h2>
          <p className="text-muted-foreground mb-6">
            {theme === 'light' 
              ? 'Bright yellow and white coffee shop atmosphere with high contrast dark text for maximum readability'
              : 'Cozy evening coffee shop ambiance with deep coffee tones and golden accents'
            }
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorSwatch label="Primary" color="var(--primary)" />
            <ColorSwatch label="Secondary" color="var(--secondary)" />
            <ColorSwatch label="Accent" color="var(--accent)" />
            <ColorSwatch label="Background" color="var(--background)" />
          </div>
        </div>

        {/* Theme Toggle Components */}
        <div className="card-base">
          <h2 className="text-2xl font-semibold mb-6">Theme Toggle Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Default</h3>
              <div className="flex justify-center p-4 bg-muted/30 rounded-xl">
                <ThemeToggle />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Header Style</h3>
              <div className="flex justify-center p-4 bg-muted/30 rounded-xl">
                <HeaderThemeToggle />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Sidebar Style</h3>
              <div className="flex justify-center p-4 bg-muted/30 rounded-xl">
                <SidebarThemeToggle />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Coffee Style</h3>
              <div className="flex justify-center p-4 bg-muted/30 rounded-xl">
                <CoffeeThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* UI Components Preview */}
        <div className="card-base">
          <h2 className="text-2xl font-semibold mb-6">UI Components Preview</h2>
          <div className="space-y-6">
            {/* Buttons */}
            <div>
              <h3 className="font-medium mb-3">Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary">Primary Button</button>
                <button className="btn-secondary">Secondary Button</button>
                <button className="btn-danger">Danger Button</button>
              </div>
            </div>

            {/* Form Elements */}
            <div>
              <h3 className="font-medium mb-3">Form Elements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <input 
                  type="text" 
                  placeholder="Text input" 
                  className="input-base"
                />
                <select className="input-base">
                  <option>Select option</option>
                  <option>Ethiopian Coffee</option>
                  <option>Americano</option>
                </select>
              </div>
            </div>

            {/* Cards */}
            <div>
              <h3 className="font-medium mb-3">Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-base">
                  <h4 className="font-semibold mb-2">Menu Item</h4>
                  <p className="text-muted-foreground text-sm mb-3">Traditional Ethiopian coffee with rich flavor</p>
                  <div className="text-accent font-bold">$4.99</div>
                </div>
                <div className="card-base bg-accent/5 border-accent/20">
                  <h4 className="font-semibold mb-2 text-accent">Featured Item</h4>
                  <p className="text-muted-foreground text-sm mb-3">Special blend of the day</p>
                  <div className="text-accent font-bold">$6.99</div>
                </div>
                <div className="card-base">
                  <h4 className="font-semibold mb-2">Regular Item</h4>
                  <p className="text-muted-foreground text-sm mb-3">Classic coffee preparation</p>
                  <div className="text-accent font-bold">$3.99</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="card-base">
          <h2 className="text-2xl font-semibold mb-6">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold brand-font">Prime Addis Coffee</h1>
            <h2 className="text-3xl font-semibold">Heading Level 2</h2>
            <h3 className="text-2xl font-semibold">Heading Level 3</h3>
            <h4 className="text-xl font-medium">Heading Level 4</h4>
            <p className="text-base text-foreground">
              Regular paragraph text with proper contrast and readability. 
              This demonstrates how text appears in the current theme.
            </p>
            <p className="text-sm text-muted-foreground">
              Muted text for secondary information and descriptions.
            </p>
          </div>
        </div>

        {/* Theme Settings Component */}
        <div className="card-base">
          <h2 className="text-2xl font-semibold mb-6">Advanced Theme Settings</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-4">
                Use the advanced theme settings for more control over the appearance.
              </p>
              <div className="flex items-center gap-4">
                <ThemeSettings />
                <CompactThemeSettings />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="text-center">
      <div 
        className="w-full h-16 rounded-lg border border-border mb-2"
        style={{ backgroundColor: color }}
      />
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground font-mono">{color}</div>
    </div>
  )
}