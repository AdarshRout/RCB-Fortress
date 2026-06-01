# 🏆 RCB BLINKBREAKS

A fast-paced, high-performance, and visually spectacular tap-to-shatter web mini-game built to reward Royal Challengers Bangalore (RCB) fans with exclusive **Blinkit** coupon codes! 

Double-tap the RCB-engraved bricks under intense time pressure to smash the fortress and unlock up to a **50% discount** on your next Munchies order!

---

## ⚡ Live Preview & Showcase

| Platform | Recommended Resolution | Play Duration |
| :--- | :--- | :--- |
| **Mobile & Tablet** | Touchscreen Optimized | **19 Seconds** |
| **Desktop** | Mouse Double-Click Optimized | **19 Seconds** |

---

## 🎮 Game Rules & Mechanics

The fortress is built from a high-fidelity grid. Here's what you need to know before stepping onto the pitch:

1. **The Wall:** Consists of a **128-brick** grid (**8 columns × 16 rows**).
2. **Double-Tap to Shatter:** 
   * **Touch Devices:** Double-tap any brick within **300ms** to shatter it. A custom tap registry tracks taps to keep the game incredibly responsive.
   * **Desktop Devices:** Fallback to native double-clicks is supported.
3. **The Countdown:** You have a **19-second timer** to smash as many bricks as possible. **Crucially, the countdown only starts on your very first broken brick**, giving you time to prepare.
4. **Dynamic Rewards:** The discount is calculated proportionally based on the percentage of the wall destroyed, capping at a massive **50% OFF**:
   $$\text{Discount \%} = \text{round}\left( \frac{\text{Bricks Shattered}}{128} \times 50 \right)$$
5. **Coupon Code:** Unlocks a custom coupon code: `RCB-MUNCH[discount]` (e.g. `RCB-MUNCH50` for clearing the whole board).

---

## ✨ Features

- **🎮 Responsive Double-Tap System:** Touch-detection custom event handler that prevents multi-touch zooming and tracks double-taps on mobile devices with zero lag.
- **💥 Visual Explosions & Floaters:** Shattered bricks trigger:
  - A vibrant radial burst of particles matching the RCB brand colors (Red, Gold, White).
  - High-performance keyframe animations that float trophies upward off the board.
- **📊 Interactive Real-time HUD:** Real-time feedback bar for broken bricks and a ticking timer that turns glowing red when under 5 seconds.
- **🦁 Iconic RCB Branding Transition:** When the timer runs out, the grid disappears, triggering a full-screen pop-in of the official glowing **RCB Logo** surrounded by sweeping searchlight effects.
- **🎨 Glassmorphic Result Dashboard:** A premium post-game modal showing exact statistics, a dynamic title (based on performance, from *"Keep Trying!"* to *"Ee Sala! 🏆"*), an interactive confetti canvas, a retry button, and a **one-click copy button** for your discount code.
- **📱 Zero Pinch-to-Zoom & Gesture Interference:** Touchmove guards ensure that vigorous tapping does not cause viewport shifts or unwanted zooms on mobile browsers.

---

## 🛠️ Technology Stack

Built with vanilla web technology for absolute speed, accessibility, and smooth 60 FPS animations:

- **HTML5:** Semantic architecture, customized metadata, dynamic `<canvas>` for confetti render.
- **CSS3:** Custom properties (CSS variables), grid systems, custom responsive media queries, high-performance GPU-accelerated translate transitions, keyframe animations, and HSL gradient overlays.
- **JavaScript (ES6):**
  - **Custom Map Tap Registry:** Tracks and schedules tap expirations.
  - **Dynamic Canvas Confetti Engine:** Multi-particle physics (wind, gravity, angle, spin) without third-party libraries.
  - **Clipboard API Integration:** Smooth, async coupon-code copying.

---

## 📂 Repository Structure

```files
Blinkit/
│
├── index.html        # Main HTML skeleton & layout
├── style.css         # Glassmorphic themes, responsive grids, and animations
├── app.js            # Custom particle systems, confetti, timer & game loop
├── .gitignore        # Keeps the repository clean of temporary OS/IDE files
└── README.md         # Comprehensive game handbook & overview
```

### 🖼️ Asset Manifest
All media files are stored locally in the `/assets` directory:
- **`assets/Logo.svg.png`**: Glowing official Royal Challengers Bangalore logo.
- **`assets/brick_tile.png`**: High-detail brick textures for the wall.
- **`assets/champions_poster.jpg`**: Premium background banner art for intro/modals.
- **`assets/trophy.png`**: Visual overlay asset for trophies.

---

## 🚀 How to Play

No build steps or dependencies required! You can launch the game instantly:

### Method 1: Double-Click
Simply navigate to your local clone directory and double-click `index.html` to open it directly in your browser.

### Method 2: Local Python Server (Recommended)
If you want to test on mobile devices over the same local network:
1. Open a terminal in the project directory.
2. Run:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.

---

## 🏆 Play Bold!

*"Ee Sala Cup Namde"* — Smash the bricks, beat the clock, and claim your Blinkit rewards! 🔴🟡
