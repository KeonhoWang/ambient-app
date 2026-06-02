import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";

const WEATHER_API_KEY = "ef7c590afaac5f8fb2866b533374205e";

const SOUNDS = [
  {
    id: "rain",
    label: "Rain",
    emoji: "🌧️",
    color: "from-blue-500 to-blue-700",
    src: "/sounds/rain.mp3",
  },
  {
    id: "ocean",
    label: "Ocean",
    emoji: "🌊",
    color: "from-cyan-500 to-cyan-700",
    src: "/sounds/ocean.mp3",
  },
  {
    id: "fire",
    label: "Fire",
    emoji: "🔥",
    color: "from-orange-500 to-red-600",
    src: "/sounds/fire.mp3",
  },
  {
    id: "wind",
    label: "Wind",
    emoji: "🌬️",
    color: "from-teal-400 to-teal-600",
    src: "/sounds/wind.mp3",
  },
  {
    id: "birds",
    label: "Birds",
    emoji: "🐦",
    color: "from-green-400 to-green-600",
    src: "/sounds/birds.mp3",
  },
  {
    id: "cafe",
    label: "Café",
    emoji: "☕",
    color: "from-yellow-600 to-amber-700",
    src: "/sounds/cafe.mp3",
  },
];

const POMODORO_MODES = [
  { label: "Focus", duration: 25 * 60, color: "text-red-400" },
  { label: "Short Break", duration: 5 * 60, color: "text-green-400" },
  { label: "Long Break", duration: 15 * 60, color: "text-blue-400" },
];

const THEMES = {
  dark: { bg: "bg-gray-950", card: "bg-gray-900", name: "🌑 Dark" },
  forest: { bg: "bg-green-950", card: "bg-green-900", name: "🌲 Forest" },
  ocean: { bg: "bg-blue-950", card: "bg-blue-900", name: "🌊 Ocean" },
  cozy: { bg: "bg-amber-950", card: "bg-amber-900", name: "🕯️ Cozy" },
};

const WEATHER_MAP = {
  Thunderstorm: ["rain", "wind"],
  Drizzle: ["rain"],
  Rain: ["rain", "ocean"],
  Snow: ["wind"],
  Clear: ["birds"],
  Clouds: ["wind", "cafe"],
  Mist: ["rain", "wind"],
  Fog: ["wind", "cafe"],
};

function getWeatherSuggestion(weatherMain) {
  return WEATHER_MAP[weatherMain] || ["cafe"];
}

function ParticleBackground({ activeSounds }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);
  const activeSoundsRef = useRef(activeSounds);

  useEffect(() => {
    activeSoundsRef.current = activeSounds;
  }, [activeSounds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const getColor = () => {
      const active = activeSoundsRef.current;
      if (active.includes("fire")) return "#ff6b35";
      if (active.includes("ocean")) return "#06b6d4";
      if (active.includes("rain")) return "#60a5fa";
      if (active.includes("wind")) return "#5eead4";
      if (active.includes("birds")) return "#86efac";
      if (active.includes("cafe")) return "#fbbf24";
      return "#ffffff";
    };

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      size: Math.random() * 4 + 1,
      speedY: -(Math.random() * 1.5 + 0.5),
      speedX: (Math.random() - 0.5) * 0.8,
      opacity: Math.random() * 0.6 + 0.2,
      color: getColor(),
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (
        activeSoundsRef.current.length > 0 &&
        particlesRef.current.length < 80
      ) {
        particlesRef.current.push(createParticle());
      }
      particlesRef.current = particlesRef.current.filter(
        (p) => p.opacity > 0 && p.y > -10
      );
      particlesRef.current.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity -= 0.002;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.floor(p.opacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

function SoundCard({ sound, volume, playing, onToggle, onVolume }) {
  return (
    <div
      className={`bg-gradient-to-br ${
        sound.color
      } rounded-2xl p-5 flex flex-col items-center gap-3 shadow-lg transition-all ${
        playing ? "scale-105 ring-2 ring-white/50" : ""
      }`}
    >
      <div className={`text-5xl ${playing ? "animate-bounce" : ""}`}>
        {sound.emoji}
      </div>
      <div className="text-white font-bold text-lg">{sound.label}</div>
      <button
        onClick={onToggle}
        className={`w-12 h-12 rounded-full text-xl font-bold shadow-md transition-all ${
          playing ? "bg-white text-black scale-110" : "bg-white/30 text-white"
        }`}
      >
        {playing ? "⏸" : "▶️"}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => onVolume(parseFloat(e.target.value))}
        className="w-full accent-white"
      />
      <div className="text-white/70 text-xs">
        {Math.round(volume * 100)}% volume
      </div>
    </div>
  );
}

function PomodoroTimer({ cardBg }) {
  const [modeIndex, setModeIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(POMODORO_MODES[0].duration);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const mode = POMODORO_MODES[modeIndex];

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const switchMode = (i) => {
    setModeIndex(i);
    setTimeLeft(POMODORO_MODES[i].duration);
    setRunning(false);
  };
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className={`${cardBg} rounded-2xl p-6 w-full max-w-2xl shadow-xl`}>
      <h2 className="text-white font-bold text-xl mb-4 text-center">
        ⏱ Pomodoro Timer
      </h2>
      <div className="flex gap-2 justify-center mb-4">
        {POMODORO_MODES.map((m, i) => (
          <button
            key={m.label}
            onClick={() => switchMode(i)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              modeIndex === i
                ? "bg-white text-black"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div
        className={`text-6xl font-mono font-bold text-center mb-4 ${mode.color}`}
      >
        {mins}:{secs}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
        <div
          className="bg-white h-2 rounded-full transition-all"
          style={{ width: `${(1 - timeLeft / mode.duration) * 100}%` }}
        />
      </div>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setRunning(!running)}
          className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all"
        >
          {running ? "⏸ Pause" : "▶️ Start"}
        </button>
        <button
          onClick={() => {
            setTimeLeft(mode.duration);
            setRunning(false);
          }}
          className="px-6 py-2 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-all"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}

function StatsPage({ stats, cardBg, onClose }) {
  const totalMins = Object.values(stats).reduce((a, b) => a + b, 0);
  const totalHours = (totalMins / 60).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className={`${cardBg} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold text-xl">📊 Your Stats</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="bg-white/10 rounded-xl p-4 mb-4 text-center">
          <div className="text-4xl font-bold text-white">{totalHours}h</div>
          <div className="text-gray-400 text-sm mt-1">Total listening time</div>
        </div>

        <div className="flex flex-col gap-3">
          {SOUNDS.map((sound) => {
            const mins = stats[sound.id] || 0;
            const percent = totalMins > 0 ? (mins / totalMins) * 100 : 0;
            return (
              <div key={sound.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">
                    {sound.emoji} {sound.label}
                  </span>
                  <span className="text-gray-400">{mins} mins</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${sound.color} h-2 rounded-full transition-all`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("ambient-stats");
            onClose();
            window.location.reload();
          }}
          className="mt-6 w-full py-2 bg-red-600/30 text-red-400 rounded-full text-sm hover:bg-red-600/50 transition-all"
        >
          🗑 Reset Stats
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [volumes, setVolumes] = useState(() => {
    const saved = localStorage.getItem("ambient-volumes");
    return saved
      ? JSON.parse(saved)
      : Object.fromEntries(SOUNDS.map((s) => [s.id, 0.5]));
  });
  const [playing, setPlaying] = useState(
    Object.fromEntries(SOUNDS.map((s) => [s.id, false]))
  );
  const [mixName, setMixName] = useState("");
  const [savedMixes, setSavedMixes] = useState(() => {
    const saved = localStorage.getItem("ambient-mixes");
    return saved ? JSON.parse(saved) : {};
  });
  const [showSaved, setShowSaved] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("ambient-stats");
    return saved
      ? JSON.parse(saved)
      : Object.fromEntries(SOUNDS.map((s) => [s.id, 0]));
  });
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  const howlRefs = useRef(
    Object.fromEntries(
      SOUNDS.map((s) => [
        s.id,
        new Howl({ src: [s.src], loop: true, volume: 0.5 }),
      ])
    )
  );

  // Stats tracker — counts minutes per sound
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => {
        const updated = { ...prev };
        SOUNDS.forEach((s) => {
          if (playing[s.id]) updated[s.id] = (updated[s.id] || 0) + 1;
        });
        localStorage.setItem("ambient-stats", JSON.stringify(updated));
        return updated;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [playing]);

  useEffect(() => {
    localStorage.setItem("ambient-volumes", JSON.stringify(volumes));
  }, [volumes]);

  const toggleSound = (id) => {
    const howl = howlRefs.current[id];
    if (playing[id]) {
      howl.pause();
    } else {
      howl.play();
    }
    setPlaying((p) => ({ ...p, [id]: !p[id] }));
  };

  const changeVolume = (id, v) => {
    howlRefs.current[id].volume(v);
    setVolumes((prev) => ({ ...prev, [id]: v }));
  };

  const stopAll = () => {
    SOUNDS.forEach((s) => howlRefs.current[s.id].stop());
    setPlaying(Object.fromEntries(SOUNDS.map((s) => [s.id, false])));
  };

  const saveMix = () => {
    if (!mixName.trim()) return;
    const newMixes = { ...savedMixes, [mixName]: { volumes, playing } };
    setSavedMixes(newMixes);
    localStorage.setItem("ambient-mixes", JSON.stringify(newMixes));
    setMixName("");
    alert(`✅ Mix "${mixName}" saved!`);
  };

  const loadMix = (name) => {
    const mix = savedMixes[name];
    if (!mix) return;
    stopAll();
    setVolumes(mix.volumes);
    SOUNDS.forEach((s) => {
      howlRefs.current[s.id].volume(mix.volumes[s.id]);
      if (mix.playing[s.id]) howlRefs.current[s.id].play();
    });
    setPlaying(mix.playing);
    setShowSaved(false);
  };

  const deleteMix = (name) => {
    const newMixes = { ...savedMixes };
    delete newMixes[name];
    setSavedMixes(newMixes);
    localStorage.setItem("ambient-mixes", JSON.stringify(newMixes));
  };

  const exportMix = () => {
    const data = JSON.stringify({ volumes, playing, savedMixes }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-ambient-mix.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMix = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.savedMixes) {
          setSavedMixes(data.savedMixes);
          localStorage.setItem(
            "ambient-mixes",
            JSON.stringify(data.savedMixes)
          );
          alert("✅ Mixes imported!");
        }
      } catch {
        alert("❌ Invalid file!");
      }
    };
    reader.readAsText(file);
  };

  const fetchWeather = () => {
    setWeatherLoading(true);
    setWeatherError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}`
          );
          const data = await res.json();
          if (data.cod !== 200) throw new Error("API error");
          const weatherMain = data.weather[0].main;
          const suggested = getWeatherSuggestion(weatherMain);
          setWeather({
            main: weatherMain,
            desc: data.weather[0].description,
            city: data.name,
            suggested,
          });
          setWeatherLoading(false);
        } catch {
          setWeatherError("Couldn't fetch weather. Try again!");
          setWeatherLoading(false);
        }
      },
      () => {
        setWeatherError("Location access denied. Please allow location.");
        setWeatherLoading(false);
      }
    );
  };

  const applyWeatherMix = () => {
    if (!weather) return;
    stopAll();
    const newPlaying = Object.fromEntries(SOUNDS.map((s) => [s.id, false]));
    weather.suggested.forEach((id) => {
      howlRefs.current[id].play();
      newPlaying[id] = true;
    });
    setPlaying(newPlaying);
  };

  const activeSounds = SOUNDS.filter((s) => playing[s.id]).map((s) => s.id);
  const { bg, card } = THEMES[theme];

  return (
    <div
      className={`min-h-screen ${bg} text-white flex flex-col items-center px-6 py-10 gap-8 relative transition-all duration-700`}
    >
      <ParticleBackground activeSounds={activeSounds} />

      {showStats && (
        <StatsPage
          stats={stats}
          cardBg={card}
          onClose={() => setShowStats(false)}
        />
      )}

      <div
        className="relative w-full flex flex-col items-center gap-8"
        style={{ zIndex: 1 }}
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">🎧 Ambient Mix</h1>
          <p className="text-gray-400 mt-2">
            Mix your perfect soundscape. Privacy-first, no login needed.
          </p>
        </div>

        {/* Top buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => setShowStats(true)}
            className="px-4 py-2 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-all"
          >
            📊 My Stats
          </button>
          {Object.entries(THEMES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                theme === key
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {val.name}
            </button>
          ))}
        </div>

        {/* Weather Box */}
        <div className={`${card} rounded-2xl p-6 w-full max-w-2xl shadow-xl`}>
          <h2 className="text-white font-bold text-xl mb-3">🌤️ Weather Mix</h2>
          <p className="text-gray-400 text-sm mb-4">
            Auto-suggest sounds based on your current weather!
          </p>

          {!weather && (
            <button
              onClick={fetchWeather}
              disabled={weatherLoading}
              className="px-5 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              {weatherLoading ? "⏳ Detecting..." : "📍 Detect My Weather"}
            </button>
          )}

          {weatherError && (
            <p className="text-red-400 text-sm mt-2">{weatherError}</p>
          )}

          {weather && (
            <div className="flex flex-col gap-3">
              <div className="bg-white/10 rounded-xl px-4 py-3">
                <div className="text-white font-semibold">
                  📍 {weather.city}
                </div>
                <div className="text-gray-300 text-sm capitalize">
                  {weather.desc}
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  Suggested sounds:{" "}
                  {weather.suggested
                    .map((id) => SOUNDS.find((s) => s.id === id)?.emoji)
                    .join(" ")}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyWeatherMix}
                  className="px-5 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  ✨ Apply Weather Mix
                </button>
                <button
                  onClick={() => {
                    setWeather(null);
                    setWeatherError("");
                  }}
                  className="px-5 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sound Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {SOUNDS.map((sound) => (
            <SoundCard
              key={sound.id}
              sound={sound}
              volume={volumes[sound.id]}
              playing={playing[sound.id]}
              onToggle={() => toggleSound(sound.id)}
              onVolume={(v) => changeVolume(sound.id, v)}
            />
          ))}
        </div>

        {/* Stop All */}
        <button
          onClick={stopAll}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-semibold transition-all"
        >
          ⏹ Stop All Sounds
        </button>

        {/* Save Mix */}
        <div className={`${card} rounded-2xl p-6 w-full max-w-2xl shadow-xl`}>
          <h2 className="text-white font-bold text-xl mb-4">
            💾 Save Your Mix
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Name your mix (e.g. Deep Focus)"
              value={mixName}
              onChange={(e) => setMixName(e.target.value)}
              className="flex-1 bg-white/10 text-white rounded-full px-4 py-2 outline-none focus:ring-2 ring-white/20"
            />
            <button
              onClick={saveMix}
              className="px-5 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all"
            >
              Save
            </button>
          </div>

          {Object.keys(savedMixes).length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowSaved(!showSaved)}
                className="text-gray-400 text-sm hover:text-white transition-all"
              >
                {showSaved ? "▲ Hide" : "▼ Show"} saved mixes (
                {Object.keys(savedMixes).length})
              </button>
              {showSaved && (
                <div className="mt-2 flex flex-col gap-2">
                  {Object.keys(savedMixes).map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2"
                    >
                      <span className="text-white">{name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadMix(name)}
                          className="text-sm px-3 py-1 bg-white text-black rounded-full hover:bg-gray-200 transition-all"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteMix(name)}
                          className="text-sm px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={exportMix}
              className="px-4 py-2 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-all"
            >
              📤 Export Mixes
            </button>
            <label className="px-4 py-2 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-all cursor-pointer">
              📥 Import Mixes
              <input
                type="file"
                accept=".json"
                onChange={importMix}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Pomodoro */}
        <PomodoroTimer cardBg={card} />

        <p className="text-gray-600 text-sm">
          Privacy-first · No login · No data collected
        </p>
      </div>
    </div>
  );
}
