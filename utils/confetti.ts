// Confetti burst effect — lightweight canvas-free CSS approach
export function createConfetti(count = 30) {
  const colors = ['#E11D48', '#10B981', '#00F0FF', '#FF007F', '#F59E0B', '#8B5CF6', '#fff'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 4 + Math.random() * 6;
    const x = Math.random() * 100;
    const duration = 1.5 + Math.random() * 2;
    const delay = Math.random() * 0.3;
    const rotate = Math.random() * 720;
    const shape = Math.random() > 0.5 ? '50%' : '2px';

    piece.style.cssText = `
      position:absolute;left:${x}%;top:-10px;width:${size}px;height:${size * (0.6 + Math.random() * 0.8)}px;
      background:${color};border-radius:${shape};
      animation:confettiFall ${duration}s ease-out ${delay}s forwards;
      transform:rotate(0deg);
      opacity:0;
    `;

    // Custom keyframe per piece since Tailwind doesn't have this
    piece.animate([
      { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
      { transform: `translateY(100vh) rotate(${rotate}deg)`, opacity: 0 }
    ], {
      duration: duration * 1000,
      delay: delay * 1000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    });

    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 4000);
}
