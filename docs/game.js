// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// リサイズ対応
window.addEventListener('resize', () => {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    // 星の再配置
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            speed: 0.5 + Math.random() * 1.5,
            size: Math.random() * 1.5 + 0.5
        });
    }
});

// 星の設定
const STAR_COUNT = 100;
const stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        speed: 0.5 + Math.random() * 1.5,
        size: Math.random() * 1.5 + 0.5
    });

}



// プレイヤー
const player = {
    x: WIDTH / 2,
    y: HEIGHT - 60,
    width: 32,
    height: 32,
    speed: 8
};

// 弾
const bullets = [];
const BULLET_SPEED = 8;
let bulletTimer = 0;
const BULLET_INTERVAL = 8; // 何フレームごとに弾を発射するか（連射速度2倍）

// 敵
const enemies = [];
const ENEMY_GROUP_SIZE = 10;
const ENEMY_TRAIL_LENGTH = 50;
const ENEMY_SPEED = 2;
let enemyTimer = 0;

// 爆発パーティクル
const explosions = [];


// マウス操作
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width / 2;
});

// タッチ操作
canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        player.x = touch.clientX - rect.left - player.width / 2;
    }
    e.preventDefault();
}, { passive: false });



function updateStars() {
    for (const star of stars) {
        star.y += star.speed;
        if (star.y > HEIGHT) {
            star.y = 0;
            star.x = Math.random() * WIDTH;
        }
    }

}

gameLoop();

function drawStars() {
    ctx.save();
    ctx.fillStyle = 'white';
    for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.vx !== undefined && b.vy !== undefined) {
            b.x += b.vx;
            b.y += b.vy;
        } else {
            b.y -= BULLET_SPEED;
        }
        if (b.y + b.height < 0 || b.x < -20 || b.x > WIDTH + 20) {
            bullets.splice(i, 1);
        }
    }
}

function drawBullets() {
    ctx.save();
    ctx.fillStyle = 'yellow';
    for (const b of bullets) {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();
}

function spawnEnemy() {
    const cx = Math.random() * (WIDTH - 64) + 32; // 円運動の中心x
    const r = 40 + Math.random() * 60; // 半径
    const startAngle = Math.random() * Math.PI * 2;
    // 1グループ5匹で出現、リーダーの軌跡を他が追従
    const size = 48;
    const type = Math.random();
    let leader, mode;
    if (type < 0.5) {
        // 上から
        const cx = Math.random() * (WIDTH - 64) + 32;
        const r = 40 + Math.random() * 60;
        const startAngle = Math.random() * Math.PI * 2;
        leader = {
            x: cx + Math.cos(startAngle) * r,
            y: -size,
            width: size,
            height: size,
            cx: cx,
            r: r,
            angle: startAngle,
            speed: ENEMY_SPEED * (0.7 + Math.random() * 0.6),
            angleSpeed: 0.03 + Math.random() * 0.02,
            lastX: cx + Math.cos(startAngle) * r,
            lastY: -size,
            mode: 'top',
            trail: []
        };
        mode = 'top';
    } else if (type < 0.75) {
        // 左から
        const cy = Math.random() * (HEIGHT - 200) + 100;
        const r2 = 40 + Math.random() * 60;
        const startAngle2 = Math.random() * Math.PI * 2;
        leader = {
            x: -size,
            y: cy + Math.cos(startAngle2) * r2,
            width: size,
            height: size,
            cy: cy,
            r: r2,
            angle: startAngle2,
            speed: ENEMY_SPEED * (0.7 + Math.random() * 0.6),
            angleSpeed: 0.03 + Math.random() * 0.02,
            lastX: -size,
            lastY: cy + Math.cos(startAngle2) * r2,
            mode: 'left',
            trail: []
        };
        mode = 'left';
    } else {
        // 右から
        const cy = Math.random() * (HEIGHT - 200) + 100;
        const r2 = 40 + Math.random() * 60;
        const startAngle2 = Math.random() * Math.PI * 2;
        leader = {
            x: WIDTH + size,
            y: cy + Math.cos(startAngle2) * r2,
            width: size,
            height: size,
            cy: cy,
            r: r2,
            angle: startAngle2,
            speed: ENEMY_SPEED * (0.7 + Math.random() * 0.6),
            angleSpeed: 0.03 + Math.random() * 0.02,
            lastX: WIDTH + size,
            lastY: cy + Math.cos(startAngle2) * r2,
            mode: 'right',
            trail: []
        };
        mode = 'right';
    }
    // グループ配列
    const group = [leader];
    for (let i = 1; i < ENEMY_GROUP_SIZE; i++) {
        group.push({
            ...leader,
            x: leader.x,
            y: leader.y,
            lastX: leader.x,
            lastY: leader.y,
            isFollower: true,
            followIndex: i * Math.floor(ENEMY_TRAIL_LENGTH / ENEMY_GROUP_SIZE),
            trail: []
        });
    }
    enemies.push(group);
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const group = enemies[i];
        // 先頭（リーダー）
        const leader = group[0];
        leader.lastX = leader.x;
        leader.lastY = leader.y;
        leader.angle += leader.angleSpeed;
        if (leader.mode === 'top') {
            leader.y += leader.speed;
            leader.x = leader.cx + Math.cos(leader.angle) * leader.r;
        } else if (leader.mode === 'left') {
            leader.x += leader.speed;
            leader.y = leader.cy + Math.cos(leader.angle) * leader.r;
        } else if (leader.mode === 'right') {
            leader.x -= leader.speed;
            leader.y = leader.cy + Math.cos(leader.angle) * leader.r;
        }
        // リーダーの軌跡を記録
        leader.trail.push({ x: leader.x, y: leader.y });
        if (leader.trail.length > ENEMY_TRAIL_LENGTH) leader.trail.shift();

        // フォロワー
        for (let j = 1; j < group.length; j++) {
            const follower = group[j];
            follower.lastX = follower.x;
            follower.lastY = follower.y;
            // 軌跡をたどる
            const trailIndex = Math.max(0, leader.trail.length - 1 - follower.followIndex);
            if (leader.trail[trailIndex]) {
                follower.x = leader.trail[trailIndex].x;
                follower.y = leader.trail[trailIndex].y;
            }
        }
        // グループ全体が画面外に出たら削除
        if (
            leader.mode === 'top' && leader.y > HEIGHT + leader.height ||
            leader.mode === 'left' && leader.x > WIDTH + leader.width ||
            leader.mode === 'right' && leader.x < -leader.width
        ) {
            enemies.splice(i, 1);
        }
    }
}

function drawEnemies() {
    ctx.save();
    ctx.font = '900 32px FontAwesome';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (const group of enemies) {
        for (const e of group) {
            // 青→黄色グラデーション
            const grad = ctx.createLinearGradient(e.x, e.y, e.x + e.width, e.y + e.height);
            grad.addColorStop(0, '#2196f3');
            grad.addColorStop(1, '#ffe600');
            ctx.fillStyle = grad;
            // 進行方向の角度を計算
            const dx = e.x - e.lastX;
            const dy = e.y - e.lastY;
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            ctx.save();
            ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
            ctx.rotate(angle);
            ctx.font = '900 48px FontAwesome';
            ctx.fillText("\uf188", -e.width / 2, -e.height / 2);
            ctx.restore();
        }
    }
    ctx.restore();
}

function checkCollisions() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const group = enemies[i];
        for (let g = group.length - 1; g >= 0; g--) {
            const e = group[g];
            for (let j = bullets.length - 1; j >= 0; j--) {
                const b = bullets[j];
                if (
                    b.x < e.x + e.width &&
                    b.x + b.width > e.x &&
                    b.y < e.y + e.height &&
                    b.y + b.height > e.y
                ) {
                    // パーティクル爆発を生成
                    createExplosion(e.x + e.width / 2, e.y + e.height / 2);
                    group.splice(g, 1);
                    bullets.splice(j, 1);
                    break;
                }
            }
        }
        // グループが空になったら削除
        if (group.length === 0) {
            enemies.splice(i, 1);
        }
    }
}

function drawPlayer() {
    ctx.save();
    ctx.font = '900 32px FontAwesome';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#00eaff';
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(0); // 上向き
    ctx.fillText("\ue22d", -16, -16);
    ctx.restore();
    ctx.restore();
}

function createExplosion(x, y) {
    const particles = [];
    const count = 15 + Math.floor(Math.random() * 10); // パーティクル数控えめ
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2) * (i / count);
        const speed = 1 + Math.random() * 2; // 速度控えめ
        // 赤系グラデーション（hue: 0〜30）
        const hue = 0 + Math.random() * 30;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.7,
            vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.7,
            radius: 2 + Math.random() * 2, // サイズ控えめ
            alpha: 1,
            color: `hsl(${hue}, 100%, 60%)`,
            glow: false
        });
    }
    explosions.push(particles);
}

function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const particles = explosions[i];
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.radius *= 0.96;
            p.alpha -= 0.025 + Math.random() * 0.02;
        }
        // 全パーティクルが消えたら削除
        if (particles.every(p => p.alpha <= 0 || p.radius < 0.5)) {
            explosions.splice(i, 1);
        }
    }
}

function drawExplosions() {
    for (const particles of explosions) {
        for (const p of particles) {
            if (p.alpha <= 0 || p.radius < 0.5) continue;
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.glow ? 'white' : 'yellow';
            ctx.shadowBlur = p.glow ? 40 : 16;
            ctx.fill();
            ctx.restore();
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    updateStars();
    drawStars();
    updateBullets();
    // 弾の自動連射
    bulletTimer++;
    if (bulletTimer >= BULLET_INTERVAL) {
        // 5方向弾
        const centerX = player.x + player.width / 2 - 2;
        const centerY = player.y;
    const angles = [-15, 0, 15]; // degree
        for (const deg of angles) {
            const rad = (deg * Math.PI) / 180;
            const speed = BULLET_SPEED;
            bullets.push({
                x: centerX,
                y: centerY,
                width: 4,
                height: 12,
                vx: Math.sin(rad) * speed,
                vy: -Math.cos(rad) * speed
            });
        }
        bulletTimer = 0;
    }
    updateBullets();
    drawBullets();
    enemyTimer++;
    if (enemyTimer > 40) { // 出現頻度を遅く
        spawnEnemy();
        enemyTimer = 0;
    }
    updateEnemies();
    drawEnemies();
    updateExplosions();
    drawExplosions();
    checkCollisions();
    drawPlayer();
    requestAnimationFrame(gameLoop);
}
