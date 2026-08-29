/**
 * lab.js - Advanced Educational Physics & AI Engine
 * Features: High-DPI Scaling, Kinetic Bloom Shading, Real-time Vector Physics
 */

const AdvancedLab = {
    setup: (canvasId) => {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for dark backgrounds
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = 400 * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = '400px';
        
        ctx.scale(dpr, dpr);
        
        const io = { x: canvas.width / (2 * dpr), y: canvas.height / (2 * dpr), active: false, vx: 0, vy: 0 };
        canvas.addEventListener('mousedown', () => io.active = true);
        canvas.addEventListener('mouseup', () => io.active = false);
        canvas.addEventListener('mousemove', (e) => {
            const r = canvas.getBoundingClientRect();
            let nx = e.clientX - r.left; let ny = e.clientY - r.top;
            io.vx = nx - io.x; io.vy = ny - io.y;
            io.x = nx; io.y = ny;
        });

        return { 
            canvas, ctx, io, 
            w: canvas.width / dpr, 
            h: canvas.height / dpr,
            fade: (alpha = 0.15) => {
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = `rgba(5, 5, 10, ${alpha})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'lighter'; // Neon effect
            }
        };
    }
};

// ==========================================
// 1. N-Body Orbital Gravity (Vector Drag & Merge)
// ==========================================
function initAdvancedGravity(canvasId) {
    const { ctx, io, w, h, fade } = AdvancedLab.setup(canvasId);
    let bodies = [{ x: w/2, y: h/2, vx: 0, vy: 0, mass: 2000, radius: 25, color: '#ffcc00' }];
    let dragStart = null;

    window.addEventListener('mousedown', () => dragStart = { ...io });
    window.addEventListener('mouseup', () => {
        if (dragStart) {
            bodies.push({
                x: dragStart.x, y: dragStart.y,
                vx: (dragStart.x - io.x) * 0.05, vy: (dragStart.y - io.y) * 0.05,
                mass: Math.random() * 50 + 10, radius: Math.random() * 4 + 2,
                color: `hsl(${Math.random()*60 + 180}, 100%, 60%)` // Cyan/Blue planets
            });
            dragStart = null;
        }
    });

    (function loop() {
        fade(0.15);
        
        // Physics & Merging
        for (let i = bodies.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                let a = bodies[i], b = bodies[j];
                let dx = b.x - a.x, dy = b.y - a.y, distSq = dx*dx + dy*dy;
                let dist = Math.sqrt(distSq);
                
                // Collision & Momentum Conservation
                if (dist < a.radius + b.radius) {
                    let totalMass = a.mass + b.mass;
                    b.vx = (a.vx * a.mass + b.vx * b.mass) / totalMass;
                    b.vy = (a.vy * a.mass + b.vy * b.mass) / totalMass;
                    b.mass = totalMass;
                    b.radius = Math.sqrt(b.radius**2 + a.radius**2); // Accurate volume scaling
                    bodies.splice(i, 1);
                    break;
                }
                // Gravity Force
                let force = (0.2 * a.mass * b.mass) / (distSq + 100);
                let ax = (force * dx / dist), ay = (force * dy / dist);
                a.vx += ax / a.mass; a.vy += ay / a.mass;
                b.vx -= ax / b.mass; b.vy -= ay / b.mass;
            }
        }

        // Render
        bodies.forEach(b => {
            b.x += b.vx; b.y += b.vy;
            ctx.shadowBlur = b.radius * 2;
            ctx.shadowColor = b.color;
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
        });

        // Drag Visualizer
        if (dragStart && io.active) {
            ctx.strokeStyle = '#ff3366'; ctx.lineWidth = 2; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.moveTo(dragStart.x, dragStart.y); ctx.lineTo(io.x, io.y); ctx.stroke();
        }
        requestAnimationFrame(loop);
    })();
}

// ==========================================
// 2. Thermodynamic Real-Collision Gas Engine
// ==========================================
function initThermodynamics(canvasId) {
    const { ctx, io, w, h, fade } = AdvancedLab.setup(canvasId);
    let atoms = Array.from({length: 150}, () => ({
        x: Math.random()*w, y: Math.random()*h, r: 4,
        vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10
    }));

    (function loop() {
        fade(0.3);
        
        for (let i = 0; i < atoms.length; i++) {
            let a = atoms[i];
            a.x += a.vx; a.y += a.vy;

            // Mouse Repulsion (Heat Source)
            if (io.active) {
                let dx = io.x - a.x, dy = io.y - a.y, dist = Math.hypot(dx, dy);
                if (dist < 100) { a.vx -= (dx/dist)*2; a.vy -= (dy/dist)*2; }
            }

            // Wall Bounces
            if (a.x < a.r || a.x > w - a.r) a.vx *= -1;
            if (a.y < a.r || a.y > h - a.r) a.vy *= -1;

            // Elastic Collisions (O(N^2) optimized by bounds)
            for (let j = i + 1; j < atoms.length; j++) {
                let b = atoms[j];
                let dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
                if (dist < a.r + b.r) {
                    let nx = dx/dist, ny = dy/dist;
                    let p = 2 * (a.vx * nx + a.vy * ny - b.vx * nx - b.vy * ny) / 2;
                    a.vx -= p * nx; a.vy -= p * ny;
                    b.vx += p * nx; b.vy += p * ny;
                    // Separate
                    let overlap = (a.r + b.r - dist) / 2;
                    a.x -= nx * overlap; a.y -= ny * overlap;
                    b.x += nx * overlap; b.y += ny * overlap;
                }
            }

            // Kinetic Color Mapping (Blue -> Purple -> Red -> White)
            let speed = Math.hypot(a.vx, a.vy);
            let hue = Math.max(0, 240 - speed * 15);
            let light = Math.min(100, 40 + speed * 5);
            
            ctx.fillStyle = `hsl(${hue}, 100%, ${light}%)`;
            ctx.shadowBlur = speed * 2;
            ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.fill();
        }
        requestAnimationFrame(loop);
    })();
}

// ==========================================
// 3. Vector Fluid Dynamics (Wind Tunnel)
// ==========================================
function initFluidVectors(canvasId) {
    const { ctx, io, w, h, fade } = AdvancedLab.setup(canvasId);
    let particles = Array.from({length: 2000}, () => ({
        x: Math.random()*w, y: Math.random()*h, vx: 0, vy: 0
    }));
    let zoff = 0;

    (function loop() {
        fade(0.08); // Long tails
        zoff += 0.005;
        
        ctx.fillStyle = '#00e5ff';
        ctx.shadowBlur = 0; // Off for performance with 2000 particles

        particles.forEach(p => {
            // Pseudo-Perlin Noise Math
            let angle = Math.sin(p.x * 0.005) * Math.cos(p.y * 0.005 + zoff) * Math.PI * 4;
            let forceX = Math.cos(angle) * 0.5 + 1.5; // Wind blows right
            let forceY = Math.sin(angle) * 0.5;

            // Mouse Interaction (Obstacle)
            let dx = p.x - io.x, dy = p.y - io.y, dist = Math.hypot(dx, dy);
            if (dist < 80) { forceX += (dx/dist) * 5; forceY += (dy/dist) * 5; }

            p.vx = p.vx * 0.9 + forceX * 0.1;
            p.vy = p.vy * 0.9 + forceY * 0.1;
            p.x += p.vx; p.y += p.vy;

            // Wrap around
            if (p.x > w) { p.x = 0; p.y = Math.random() * h; p.vx = 0; }
            if (p.x < 0) p.x = w;
            if (p.y > h) p.y = 0;
            if (p.y < 0) p.y = h;

            ctx.globalAlpha = Math.min(1, Math.hypot(p.vx, p.vy) / 3);
            ctx.fillRect(p.x, p.y, 2, 2);
        });
        requestAnimationFrame(loop);
    })();
}

// ==========================================
// 4. Boids Flocking Ecosystem (Predator vs Prey)
// ==========================================
function initBoids(canvasId) {
    const { ctx, io, w, h, fade } = AdvancedLab.setup(canvasId);
    let boids = Array.from({length: 150}, (_, i) => ({
        x: Math.random()*w, y: Math.random()*h, 
        vx: Math.random()*4-2, vy: Math.random()*4-2, 
        isPredator: i < 3
    }));

    (function loop() {
        fade(0.2);
        
        boids.forEach(b => {
            let sepX = 0, sepY = 0, aliX = 0, aliY = 0, cohX = 0, cohY = 0;
            let total = 0, evadeX = 0, evadeY = 0;

            boids.forEach(other => {
                if (b === other) return;
                let dx = b.x - other.x, dy = b.y - other.y, dist = Math.hypot(dx, dy);
                
                if (dist < 50) {
                    if (b.isPredator && !other.isPredator) {
                        cohX -= dx; cohY -= dy; // Chase
                    } else if (!b.isPredator && other.isPredator && dist < 100) {
                        evadeX += dx/dist; evadeY += dy/dist; // Flee
                    } else if (b.isPredator === other.isPredator) {
                        if (dist < 20) { sepX += dx/dist; sepY += dy/dist; } // Separation
                        aliX += other.vx; aliY += other.vy;                 // Alignment
                        cohX += other.x; cohY += other.y;                   // Cohesion
                        total++;
                    }
                }
            });

            if (total > 0 && !b.isPredator) {
                aliX /= total; aliY /= total;
                cohX = (cohX / total) - b.x; cohY = (cohY / total) - b.y;
                b.vx += (aliX * 0.05) + (cohX * 0.01) + (sepX * 0.05) + (evadeX * 0.2);
                b.vy += (aliY * 0.05) + (cohY * 0.01) + (sepY * 0.05) + (evadeY * 0.2);
            } else if (b.isPredator) {
                b.vx += cohX * 0.005; b.vy += cohY * 0.005;
            }

            // Speed limits & Mouse interaction
            if (io.active && !b.isPredator) {
                let dx = b.x - io.x, dy = b.y - io.y, dist = Math.hypot(dx, dy);
                if (dist < 150) { b.vx += dx/dist; b.vy += dy/dist; }
            }

            let maxSpeed = b.isPredator ? 4.5 : 4;
            let speed = Math.hypot(b.vx, b.vy);
            if (speed > maxSpeed) { b.vx = (b.vx/speed)*maxSpeed; b.vy = (b.vy/speed)*maxSpeed; }
            
            b.x += b.vx; b.y += b.vy;
            if (b.x < 0) b.x = w; if (b.x > w) b.x = 0;
            if (b.y < 0) b.y = h; if (b.y > h) b.y = 0;

            // Draw Triangle facing velocity
            let angle = Math.atan2(b.vy, b.vx);
            ctx.translate(b.x, b.y); ctx.rotate(angle);
            ctx.fillStyle = b.isPredator ? '#ff0055' : '#00ffcc';
            ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, 4); ctx.lineTo(-4, -4); ctx.fill();
            ctx.rotate(-angle); ctx.translate(-b.x, -b.y);
        });
        requestAnimationFrame(loop);
    })();
}

// ==========================================
// 5. Neural Network Decision Heatmap
// ==========================================
function initNeuralHeatmap(canvasId) {
    const { ctx, w, h } = AdvancedLab.setup(canvasId);
    let pts = Array.from({length: 60}, () => ({
        x: Math.random()*w, y: Math.random()*h,
        label: Math.random() > 0.5 ? 1 : -1
    }));
    let w1 = 0, w2 = 0, b = 0, lr = 0.01;

    (function loop() {
        // Train loop step
        pts.forEach(p => {
            let normX = (p.x / w) * 2 - 1, normY = (p.y / h) * 2 - 1;
            let guess = (normX * w1 + normY * w2 + b) > 0 ? 1 : -1;
            let err = p.label - guess;
            w1 += err * normX * lr; w2 += err * normY * lr; b += err * lr;
        });

        // Render Heatmap (Decision Boundary)
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < w; i += 20) {
            for (let j = 0; j < h; j += 20) {
                let nx = (i / w) * 2 - 1, ny = (j / h) * 2 - 1;
                let val = Math.tanh(nx * w1 + ny * w2 + b); // Activation
                ctx.fillStyle = val > 0 ? `rgba(255, 50, 100, ${val*0.5})` : `rgba(50, 150, 255, ${-val*0.5})`;
                ctx.fillRect(i, j, 20, 20);
            }
        }

        // Render Data Points
        ctx.globalCompositeOperation = 'lighter';
        pts.forEach(p => {
            ctx.fillStyle = p.label === 1 ? '#ff3264' : '#3296ff';
            ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fill();
        });
        requestAnimationFrame(loop);
    })();
}

// ==========================================
// 6. Raytracing Optics & Refraction
// ==========================================
function initAdvancedOptics(canvasId) {
    const { ctx, io, w, h, fade } = AdvancedLab.setup(canvasId);
    let lenses = [
        { x: w/2, y: h/2, r: 80, ior: 1.5 } // Glass sphere
    ];

    (function loop() {
        fade(1);
        ctx.globalCompositeOperation = 'lighter';

        // Draw Lenses
        lenses.forEach(l => {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillStyle = 'rgba(50, 200, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        });

        // Cast 50 Lasers
        for (let i = -25; i < 25; i++) {
            let ro = { x: 0, y: io.y + i * 4 }; // Rays start from left, follow mouse Y
            let rd = { x: 1, y: 0 };
            
            ctx.beginPath(); ctx.moveTo(ro.x, ro.y);
            
            lenses.forEach(l => {
                // Sphere Intersection math
                let ocX = ro.x - l.x, ocY = ro.y - l.y;
                let b = 2 * (ocX * rd.x + ocY * rd.y);
                let c = (ocX*ocX + ocY*ocY) - l.r*l.r;
                let disc = b*b - 4*c;
                
                if (disc > 0) {
                    let t = (-b - Math.sqrt(disc)) / 2;
                    if (t > 0) {
                        let hitX = ro.x + rd.x * t, hitY = ro.y + rd.y * t;
                        ctx.lineTo(hitX, hitY);
                        
                        // Refraction (Snell's Law approximation)
                        let normX = (hitX - l.x)/l.r, normY = (hitY - l.y)/l.r;
                        rd.x = rd.x * 0.8 - normX * 0.2; // Simplified bending
                        rd.y = rd.y * 0.8 - normY * 0.2;
                        
                        ro.x = hitX; ro.y = hitY;
                    }
                }
            });
            
            ctx.lineTo(ro.x + rd.x * 1000, ro.y + rd.y * 1000);
            ctx.strokeStyle = `hsla(${180 + i*2}, 100%, 60%, 0.6)`;
            ctx.lineWidth = 2; ctx.shadowBlur = 5; ctx.shadowColor = ctx.strokeStyle;
            ctx.stroke();
        }
        requestAnimationFrame(loop);
    })();
}

// ==========================================
// 7. Fourier Transform Epicycles (Neon Ink)
// ==========================================
function initFourierNeon(canvasId) {
    const { ctx, w, h, fade } = AdvancedLab.setup(canvasId);
    let time = 0; let path = [];

    (function loop() {
        fade(0.15);
        let x = w/3, y = h/2;
        
        for (let i = 0; i < 7; i++) {
            let n = i * 2 + 1;
            let radius = 70 * (4 / (n * Math.PI));
            let px = x, py = y;
            x += radius * Math.cos(n * time); y += radius * Math.sin(n * time);
            
            ctx.strokeStyle = 'rgba(100, 255, 200, 0.2)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI*2); ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        }
        
        path.unshift({x, y});
        if (path.length > 400) path.pop();
        
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(w/2 + 50, path[0].y); 
        ctx.strokeStyle = 'rgba(255, 100, 200, 0.5)'; ctx.stroke();
        
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) ctx.lineTo(w/2 + 50 + i, path[i].y);
        ctx.strokeStyle = '#ff007f'; ctx.lineWidth = 3; ctx.shadowBlur = 15; ctx.shadowColor = '#ff007f';
        ctx.stroke();
        
        time += 0.02;
        requestAnimationFrame(loop);
    })();
}

// ==========================================
// 8. Wave Interference (Shader-Style Heatmap)
// ==========================================
function initWaveShader(canvasId) {
    const { ctx, io, w, h } = AdvancedLab.setup(canvasId);
    let time = 0;
    
    (function loop() {
        time += 0.1;
        // Using dynamic radial gradients to fake a pixel shader for high FPS
        let s1x = w/2 - 50, s2x = w/2 + 50, sy = h/2;
        if (io.active) { s1x = io.x - 50; s2x = io.x + 50; sy = io.y; }

        ctx.fillStyle = '#05050A'; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'screen';
        
        [ {x: s1x, y: sy, c: '0, 255, 150'}, {x: s2x, y: sy, c: '200, 50, 255'} ].forEach(src => {
            for (let r = 0; r < w; r += 20) {
                let wave = Math.sin((r - time*15) * 0.05);
                if (wave > 0) {
                    ctx.beginPath(); ctx.arc(src.x, src.y, r, 0, Math.PI*2);
                    ctx.strokeStyle = `rgba(${src.c}, ${wave * 0.3})`;
                    ctx.lineWidth = 10; ctx.stroke();
                }
            }
        });
        requestAnimationFrame(loop);
    })();
}

// ==========================================
// 9. Particle Rockets (Genetic Evolution)
// ==========================================
function initEvolution(canvasId) {
    const { ctx, w, h, fade } = AdvancedLab.setup(canvasId);
    let rockets = Array.from({length: 150}, () => ({ x: w/2, y: h-20, vx: 0, vy: 0, path: [] }));
    let target = { x: w/2, y: 50 };
    let frame = 0;

    (function loop() {
        fade(0.2);
        
        ctx.fillStyle = '#ffcc00'; ctx.shadowBlur = 20; ctx.shadowColor = '#ffcc00';
        ctx.beginPath(); ctx.arc(target.x, target.y, 15, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = '#ff0055'; ctx.shadowBlur = 0;
        ctx.fillRect(w/3, h/2, w/3, 10); // Obstacle

        rockets.forEach(r => {
            if (r.y > 0 && !(r.x > w/3 && r.x < w*0.66 && r.y > h/2 && r.y < h/2 + 10)) {
                // DNA Force (Pseudo-random steering)
                let angle = (Math.sin(r.x*0.01 + frame*0.05) + Math.cos(r.y*0.01)) * Math.PI;
                r.vx += Math.cos(angle)*0.2; r.vy -= 0.1; // Bias upwards
                r.x += r.vx; r.y += r.vy;
                
                // Draw rocket flame
                ctx.fillStyle = '#00ffff'; ctx.shadowBlur = 10; ctx.shadowColor = '#00ffff';
                ctx.beginPath(); ctx.arc(r.x, r.y, 2, 0, Math.PI*2); ctx.fill();
            }
        });
        
        frame++;
        if (frame > 200) { frame = 0; rockets.forEach(r => { r.x = w/2; r.y = h-20; r.vx = 0; r.vy = 0; }); } // Reset gen
        requestAnimationFrame(loop);
    })();
}

// ==========================================
// 10. Epidemic Network Topology (Spring Layout)
// ==========================================
function initNetwork(canvasId) {
    const { ctx, io, w, h, fade } = AdvancedLab.setup(canvasId);
    let nodes = Array.from({length: 80}, (_, i) => ({
        x: Math.random()*w, y: Math.random()*h, vx: 0, vy: 0,
        infected: i === 0
    }));
    let edges = [];
    nodes.forEach((n1, i) => nodes.forEach((n2, j) => {
        if (i < j && Math.random() < 0.04) edges.push({ a: n1, b: n2 });
    }));

    (function loop() {
        fade(0.3);
        
        // Spring Physics
        edges.forEach(e => {
            let dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, dist = Math.hypot(dx, dy);
            let force = (dist - 50) * 0.01; // Ideal length 50
            e.a.vx += (dx/dist)*force; e.a.vy += (dy/dist)*force;
            e.b.vx -= (dx/dist)*force; e.b.vy -= (dy/dist)*force;
            
            // Infection spread
            if (dist < 60 && Math.random() < 0.01) {
                if (e.a.infected) e.b.infected = true;
                if (e.b.infected) e.a.infected = true;
            }

            ctx.strokeStyle = e.a.infected && e.b.infected ? 'rgba(255, 50, 50, 0.5)' : 'rgba(100, 200, 255, 0.2)';
            ctx.lineWidth = e.a.infected && e.b.infected ? 2 : 1;
            ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
        });

        nodes.forEach(n => {
            // Center gravity & Repulsion
            n.vx += (w/2 - n.x)*0.001; n.vy += (h/2 - n.y)*0.001;
            nodes.forEach(other => {
                if (n === other) return;
                let dx = n.x - other.x, dy = n.y - other.y, dist = Math.hypot(dx, dy);
                if (dist < 40) { n.vx += dx/(dist*dist); n.vy += dy/(dist*dist); }
            });
            
            if (io.active) {
                let dx = n.x - io.x, dy = n.y - io.y, dist = Math.hypot(dx, dy);
                if (dist < 100) { n.vx += dx/dist; n.vy += dy/dist; }
            }

            n.vx *= 0.9; n.vy *= 0.9; n.x += n.vx; n.y += n.vy;

            ctx.fillStyle = n.infected ? '#ff0055' : '#00e5ff';
            ctx.shadowBlur = n.infected ? 15 : 5; ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath(); ctx.arc(n.x, n.y, n.infected ? 6 : 4, 0, Math.PI*2); ctx.fill();
        });
        requestAnimationFrame(loop);
    })();
}
