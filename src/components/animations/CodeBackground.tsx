import { useEffect, useRef } from "react";

const ROW_STREAMS = [
  {
    text: "const deploy = async () => { await build(); await test(); return ship(); };  export type User = { id: string; email: string; role: 'admin' | 'user'; createdAt: Date; };  function useFetch<T>(url: string): { data: T | null; loading: boolean } {  const [data, setData] = useState<T | null>(null);  ",
    speed: 38,
    dir: 1,
    y: "8%",
    opacity: 0.09,
    fontSize: "11px",
  },
  {
    text: "fn handle_request(req: HttpRequest) -> Result<Response, Error> { let body = req.body()?; let parsed: Value = serde_json::from_str(&body)?; Ok(Response::ok(parsed)) }  #[tokio::main] async fn main() { Server::new().bind('0.0.0.0:8080').run().await.unwrap(); }  ",
    speed: 28,
    dir: -1,
    y: "18%",
    opacity: 0.075,
    fontSize: "10.5px",
  },
  {
    text: "SELECT u.id, u.name, COUNT(p.id) AS projects FROM users u LEFT JOIN projects p ON p.user_id = u.id WHERE u.active = true GROUP BY u.id ORDER BY projects DESC LIMIT 20;  CREATE INDEX idx_projects_user ON projects(user_id);  ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;  ",
    speed: 52,
    dir: 1,
    y: "27%",
    opacity: 0.065,
    fontSize: "10px",
  },
  {
    text: "import { createClient } from '@supabase/supabase-js';  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);  const { data, error } = await supabase.from('projects').select('*, tags(*)').eq('published', true).order('created_at', { ascending: false });  ",
    speed: 44,
    dir: -1,
    y: "37%",
    opacity: 0.085,
    fontSize: "11px",
  },
  {
    text: "def train_model(X_train, y_train, epochs=100):  model = Sequential([Dense(128, activation='relu'), Dropout(0.3), Dense(64, activation='relu'), Dense(1, activation='sigmoid')])  model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])  return model.fit(X_train, y_train, epochs=epochs, validation_split=0.2)  ",
    speed: 33,
    dir: 1,
    y: "47%",
    opacity: 0.07,
    fontSize: "10px",
  },
  {
    text: "<component :is='layout'><router-view v-slot='{ Component }'><transition name='fade' mode='out-in'><keep-alive><component :is='Component' :key='$route.path' /></keep-alive></transition></router-view></component>  const router = createRouter({ history: createWebHistory(), routes: [...publicRoutes, ...privateRoutes] });  ",
    speed: 47,
    dir: -1,
    y: "57%",
    opacity: 0.065,
    fontSize: "10.5px",
  },
  {
    text: "export default function Page({ params }: { params: { slug: string } }) {  const data = use(fetch(`/api/posts/${params.slug}`).then(r => r.json()));  return <article className='prose mx-auto'><Mdx source={data.content} /></article>; }  export async function generateStaticParams() { const posts = await getAllPosts(); return posts.map(p => ({ slug: p.slug })); }  ",
    speed: 40,
    dir: 1,
    y: "67%",
    opacity: 0.08,
    fontSize: "11px",
  },
  {
    text: "class UserRepository implements IUserRepository { constructor(private readonly db: PrismaClient) {}  async findById(id: string): Promise<User | null> { return this.db.user.findUnique({ where: { id }, include: { profile: true, projects: true } }); }  async paginate(page: number, limit = 20) { const [data, total] = await Promise.all([this.db.user.findMany({ skip: page * limit, take: limit }), this.db.user.count()]); return { data, total }; }  ",
    speed: 25,
    dir: -1,
    y: "76%",
    opacity: 0.07,
    fontSize: "10px",
  },
  {
    text: "<?php  namespace App\\Http\\Controllers;  class ProjectController extends Controller { public function index(): JsonResponse { return response()->json(Project::with('tags')->where('published', true)->latest()->paginate(12)); }  public function store(StoreProjectRequest $req): JsonResponse { $project = Project::create($req->validated()); return response()->json($project, 201); } }  ",
    speed: 36,
    dir: 1,
    y: "85%",
    opacity: 0.065,
    fontSize: "10.5px",
  },
  {
    text: "git commit -m 'feat: add real-time collaboration'  docker build -t api:latest . && docker push registry/api:latest  kubectl apply -f k8s/  npm run test -- --coverage  terraform plan -var-file=prod.tfvars  gh pr create --title 'feat: websocket support' --body 'closes #42'  ",
    speed: 58,
    dir: -1,
    y: "94%",
    opacity: 0.06,
    fontSize: "10px",
  },
];

interface CodeRowProps {
  text: string;
  speed: number;
  dir: number;
  y: string;
  opacity: number;
  fontSize: string;
}

const CodeRow = ({ text, speed, dir, y, opacity, fontSize }: CodeRowProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const repeated = text.repeat(4);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const charWidth = parseFloat(fontSize) * 0.6;
    const segmentWidth = text.length * charWidth;

    posRef.current = dir === 1
      ? -(Math.random() * segmentWidth)
      : -(segmentWidth + Math.random() * segmentWidth);

    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      posRef.current += speed * dir * dt;

      if (dir === 1 && posRef.current > 0) {
        posRef.current -= segmentWidth;
      } else if (dir === -1 && posRef.current < -segmentWidth * 2) {
        posRef.current += segmentWidth;
      }

      if (el) {
        el.style.transform = `translateX(${posRef.current}px)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed, dir, text, fontSize]);

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none select-none overflow-hidden"
      style={{ top: y, opacity, height: "20px" }}
    >
      <div
        ref={trackRef}
        style={{
          whiteSpace: "nowrap",
          fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
          fontSize,
          lineHeight: "20px",
          color: "hsl(var(--primary))",
          letterSpacing: "0.01em",
          willChange: "transform",
        }}
      >
        {repeated}
      </div>
    </div>
  );
};

export const CodeBackground = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)",
        maskComposite: "intersect",
        WebkitMaskComposite: "destination-in",
      }}
    >
      {ROW_STREAMS.map((row, i) => (
        <CodeRow key={i} {...row} />
      ))}
    </div>
  );
};
