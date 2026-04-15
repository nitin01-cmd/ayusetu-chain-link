
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import Lenis from 'lenis';

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
	duration: 1.2,
	smooth: true,
	direction: 'vertical',
	gestureDirection: 'vertical',
	smoothTouch: false,
});

function raf(time: number) {
	lenis.raf(time);
	requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

createRoot(document.getElementById("root")!).render(<App />);
