import React, { useEffect, useCallback, useReducer } from 'react'
import { Button, Card } from 'antd'
import { TrophyOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons'

// ============================================================
// 贪吃蛇小游戏 — 纯 React + CSS 格子实现
// 使用 useReducer 管理全部游戏状态，消除 ref 同步问题
// ============================================================

// ---------- 游戏常量 ----------
const GRID_SIZE = 20          // 棋盘 20 × 20
const CELL_SIZE = 24          // 每格像素大小
const INITIAL_SPEED = 150     // 初始速度（毫秒/步）
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE

// ---------- 坐标类型 ----------
interface Point { x: number; y: number }

// ---------- 方向 ----------
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
const DELTA: Record<Direction, Point> = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
}
const OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
}

// ---------- 初始蛇身 ----------
const INITIAL_SNAKE: Point[] = [
  { x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 },
]

// ---------- 游戏状态（全部放在一个对象里）----------
interface GameState {
  snake: Point[]
  food: Point | null
  direction: Direction
  phase: 'idle' | 'playing' | 'over'
  score: number
}

// ---------- Reducer 动作 ----------
type Action =
  | { type: 'TICK' }
  | { type: 'TURN'; direction: Direction }
  | { type: 'START' }

// ---------- 生成随机食物 ----------
function generateFood(snake: Point[]): Point | null {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`))
  if (occupied.size >= TOTAL_CELLS) return null // 通关！

  // 随机尝试
  const maxAttempts = Math.min(TOTAL_CELLS * 3, 1000)
  for (let i = 0; i < maxAttempts; i++) {
    const p = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
    if (!occupied.has(`${p.x},${p.y}`)) return p
  }
  // 兜底：遍历找第一个空位
  for (let y = 0; y < GRID_SIZE; y++)
    for (let x = 0; x < GRID_SIZE; x++)
      if (!occupied.has(`${x},${y}`)) return { x, y }
  return null
}

// ---------- 初始状态 ----------
const initialState: GameState = {
  snake: INITIAL_SNAKE,
  food: generateFood(INITIAL_SNAKE)!,
  direction: 'RIGHT',
  phase: 'idle',
  score: 0,
}

// ---------- Reducer：所有状态变更集中在此 ----------
function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      const food = generateFood(INITIAL_SNAKE)!
      return { snake: INITIAL_SNAKE, food, direction: 'RIGHT', phase: 'playing', score: 0 }
    }

    case 'TURN': {
      // 不允许掉头
      if (OPPOSITE[action.direction] === state.direction) return state
      return { ...state, direction: action.direction }
    }

    case 'TICK': {
      if (state.phase !== 'playing') return state
      if (!state.food) return state // 通关后不再移动

      const { snake, food, direction } = state
      const head = snake[0]
      const d = DELTA[direction]
      const newHead: Point = { x: head.x + d.x, y: head.y + d.y }

      // 撞墙 / 撞自己 → 游戏结束
      const hitWall = newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE
      const hitSelf = snake.some(p => p.x === newHead.x && p.y === newHead.y)
      if (hitWall || hitSelf) return { ...state, phase: 'over' }

      // 是否吃到食物
      const ate = newHead.x === food.x && newHead.y === food.y

      // 新蛇身
      const newSnake = [newHead, ...snake]
      if (!ate) newSnake.pop()

      if (!ate) return { ...state, snake: newSnake }

      // 吃到食物：生成新食物（可能为 null 即通关）
      const newFood = generateFood(newSnake)
      return {
        ...state,
        snake: newSnake,
        food: newFood,
        score: state.score + 1,
        phase: newFood === null ? 'over' : 'playing',
      }
    }

    default:
      return state
  }
}

// ============================================================
// 组件
// ============================================================
interface Props {
  isActive: boolean  // 当前标签页是否可见（用于暂停）
}

const SnakeGame: React.FC<Props> = ({ isActive }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  // ---- 键盘事件（仅在游戏进行时拦截）----
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', W: 'UP', s: 'DOWN', S: 'DOWN', a: 'LEFT', A: 'LEFT', d: 'RIGHT', D: 'RIGHT',
    }
    const dir = keyMap[e.key]
    if (dir) {
      e.preventDefault()
      dispatch({ type: 'TURN', direction: dir })
    }
  }, [])

  // ---- 键盘监听：仅在 playing 时挂载，标签不可见时也卸载 ----
  useEffect(() => {
    if (state.phase === 'playing' && isActive) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [state.phase, isActive, handleKeyDown])

  // ---- 游戏主循环：仅在 playing 且标签可见时运行 ----
  useEffect(() => {
    if (state.phase !== 'playing' || !isActive) return
    const interval = setInterval(() => dispatch({ type: 'TICK' }), INITIAL_SPEED)
    return () => clearInterval(interval)
  }, [state.phase, isActive])

  // ============================================================
  // 渲染
  // ============================================================
  const { snake, food, phase, score } = state
  const isPlaying = phase === 'playing' && isActive

  return (
    <Card
      title={
        <span>
          🐍 贪吃蛇
          {phase === 'playing' && (
            <span style={{ marginLeft: 16, fontSize: 16, fontWeight: 'normal' }}>
              <TrophyOutlined style={{ color: '#faad14', marginRight: 4 }} />
              得分：{score}
            </span>
          )}
          {!isActive && phase === 'playing' && (
            <span style={{ marginLeft: 12, color: '#999', fontSize: 13 }}>（已暂停）</span>
          )}
        </span>
      }
      extra={
        phase === 'idle' ? (
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => dispatch({ type: 'START' })}>
            开始游戏
          </Button>
        ) : (
          <Button icon={<ReloadOutlined />} onClick={() => dispatch({ type: 'START' })}>
            {phase === 'over' ? '再来一局' : '重新开始'}
          </Button>
        )
      }
      style={{ maxWidth: GRID_SIZE * CELL_SIZE + 64, margin: '0 auto' }}
      styles={{ body: { display: 'flex', justifyContent: 'center', padding: '16px 24px' } }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* ========== 棋盘（CSS 线条代替 400 个 div） ========== */}
        <div
          style={{
            position: 'relative',
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            border: '2px solid #d9d9d9',
            borderRadius: 4,
            backgroundImage: [
              'repeating-linear-gradient(transparent 0, transparent 23px, #f0f0f0 23px, #f0f0f0 24px)',
              'repeating-linear-gradient(90deg, transparent 0, transparent 23px, #f0f0f0 23px, #f0f0f0 24px)',
            ].join(', '),
            backgroundColor: '#fafafa',
            margin: '0 auto',
          }}
        >
          {/* 食物 */}
          {food && (
            <div
              style={{
                position: 'absolute',
                left: food.x * CELL_SIZE + 2,
                top: food.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                borderRadius: '50%',
                background: '#ff4d4f',
                transition: 'all 0.08s',
              }}
            />
          )}

          {/* 蛇身 */}
          {snake.map((p, i) => (
            <div
              key={`s-${i}`}
              style={{
                position: 'absolute',
                left: p.x * CELL_SIZE + 1,
                top: p.y * CELL_SIZE + 1,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                borderRadius: i === 0 ? 6 : 4,
                background: i === 0 ? '#1677ff' : '#91caff',
                border: i === 0 ? '1px solid #0958d9' : '1px solid #69b1ff',
                boxSizing: 'border-box',
                transition: 'all 0.08s',
              }}
            />
          ))}

          {/* 游戏结束遮罩 */}
          {(phase === 'over') && (
            <Overlay>
              <div style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
                {food === null ? '🎉 恭喜通关！' : '💀 游戏结束'}
              </div>
              <div style={{ color: '#ffd666', fontSize: 18 }}>
                {food === null ? `你吃满了整个棋盘！` : `最终得分：${score} 分`}
              </div>
            </Overlay>
          )}

          {/* 未开始 / 暂停遮罩 */}
          {(phase === 'idle' || (phase === 'playing' && !isActive)) && (
            <Overlay dim>
              <div style={{ color: '#fff', fontSize: 22, opacity: 0.85 }}>
                {phase === 'idle'
                  ? '点击「开始游戏」按钮，用方向键操控 🎮'
                  : '切换到其他标签页，游戏已暂停 ⏸️'}
              </div>
            </Overlay>
          )}
        </div>

        {/* ========== 操作提示 ========== */}
        <div style={{ marginTop: 16, color: '#999', fontSize: 13 }}>
          ⌨️ 方向键 ↑↓←→ 或 W/A/S/D 控制蛇的移动
        </div>
      </div>
    </Card>
  )
}

// ============================================================
// 遮罩组件（消除重复样式）
// ============================================================
const Overlay: React.FC<{ children: React.ReactNode; dim?: boolean }> = ({ children, dim }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: dim ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.55)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      zIndex: 10,
    }}
  >
    {children}
  </div>
)

export default SnakeGame
