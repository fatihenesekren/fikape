"use client";

export function GarageAnimation({ userName }: { userName: string }) {
  const stars: [number, number, number][] = [
    [32,12,2],[80,6,2],[145,18,2.5],[210,9,1.5],[275,22,2],[340,7,2.5],
    [410,16,2],[470,25,2.5],[530,11,2],[600,20,2.5],[640,8,1.5],
    [60,35,1.5],[170,38,2],[290,30,1.5],[420,42,1.5],[560,36,2],[620,28,1.5],
    [15,28,1.5],[500,40,1.5],[250,50,2],[400,45,1.5],[550,52,1.5],
  ];

  // Ağaç konumları (x, boyut çarpanı)
  const trees: [number, number][] = [
    [230, 1], [310, 0.85], [390, 1.1], [470, 0.9], [540, 1.05], [610, 0.8],
  ];

  return (
    <>
      <style>{`
        /* scaleX(-1) her keyframe'e dahil → araçlar doğru yöne bakıyor */
        @keyframes carMove {
          0%, 7%   { transform: translateX(640px) scaleX(-1); opacity: 0; }
          11%      { transform: translateX(600px) scaleX(-1); opacity: 1; }
          25%      { transform: translateX(95px)  scaleX(-1); opacity: 1; }
          31%      { transform: translateX(55px)  scaleX(-1); opacity: 0; }
          100%     { transform: translateX(55px)  scaleX(-1); opacity: 0; }
        }
        @keyframes motoMove {
          0%, 31%  { transform: translateX(640px) scaleX(-1); opacity: 0; }
          35%      { transform: translateX(600px) scaleX(-1); opacity: 1; }
          49%      { transform: translateX(95px)  scaleX(-1); opacity: 1; }
          55%      { transform: translateX(55px)  scaleX(-1); opacity: 0; }
          100%     { transform: translateX(55px)  scaleX(-1); opacity: 0; }
        }
        @keyframes scooterMove {
          0%, 55%  { transform: translateX(640px) scaleX(-1); opacity: 0; }
          59%      { transform: translateX(600px) scaleX(-1); opacity: 1; }
          73%      { transform: translateX(95px)  scaleX(-1); opacity: 1; }
          79%      { transform: translateX(55px)  scaleX(-1); opacity: 0; }
          100%     { transform: translateX(55px)  scaleX(-1); opacity: 0; }
        }
        @keyframes garageDoor {
          0%, 7%    { transform: translateY(0); }
          16%, 63%  { transform: translateY(-100%); }
          78%, 100% { transform: translateY(0); }
        }
        @keyframes nameFade {
          0%, 9%   { opacity: 1; }
          13%, 79% { opacity: 0.28; }
          85%, 100%{ opacity: 1; }
        }
        @keyframes moonPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(210,180,90,0.55), 0 0 28px rgba(210,180,90,0.18); }
          50%      { box-shadow: 0 0 20px rgba(210,180,90,0.85), 0 0 40px rgba(210,180,90,0.32); }
        }
        /* Etiket counter-flip: animasyonun scaleX(-1) ini geri alır → okunabilir metin */
        .garage-label { display: block; transform: scaleX(-1); }
      `}</style>

      <div
        className="relative w-full rounded-2xl overflow-hidden mb-6 select-none"
        style={{ height: 215, background: "linear-gradient(180deg, #0f1923 0%, #1c2d4a 100%)" }}
      >
        {/* Yıldızlar */}
        {stars.map(([x,y,r],i) => (
          <div key={i} style={{
            position:"absolute", left:x, top:y, width:r*2, height:r*2,
            borderRadius:"50%", background:"white",
            opacity: 0.5 + (i%4)*0.14,
            boxShadow: i%4===0 ? `0 0 ${r*3}px rgba(255,255,255,0.9)` : undefined,
          }}/>
        ))}

        {/* Ay */}
        <div style={{
          position:"absolute", right:54, top:16, width:36, height:36,
          borderRadius:"50%",
          background:"radial-gradient(circle at 38% 38%, #f8f0c8, #d4b860)",
          animation:"moonPulse 4s ease-in-out infinite",
        }}>
          <div style={{
            position:"absolute", right:-5, top:6, width:30, height:26,
            borderRadius:"50%", background:"#182640",
          }}/>
        </div>

        {/* Yol */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:54, background:"#1e1e1e" }}>
          <div style={{
            position:"absolute", top:"40%", left:0, right:0, height:3,
            backgroundImage:"repeating-linear-gradient(to right, #3a3a3a 0px, #3a3a3a 26px, transparent 26px, transparent 54px)"
          }}/>
        </div>

        {/* Yol kenarı çizgisi */}
        <div style={{ position:"absolute", bottom:54, left:0, right:0, height:2, background:"#2a3a20" }}/>

        {/* Çam ağaçları */}
        {trees.map(([x, scale], i) => (
          <div key={i} style={{
            position:"absolute", left:x, bottom:54,
            fontSize: Math.round(28 * scale),
            lineHeight:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
          }}>
            🌲
          </div>
        ))}

        {/* GARAJ YAPISI */}
        <div style={{ position:"absolute", left:36, bottom:54, width:126, height:112 }}>
          {/* Garaj levhası */}
          <div style={{
            position:"absolute", top:-38, left:"50%", transform:"translateX(-50%)",
            background:"#0C447C", color:"white", fontWeight:800,
            fontSize:10, fontFamily:"sans-serif", letterSpacing:1.5,
            padding:"3px 10px", borderRadius:4,
            boxShadow:"0 0 10px rgba(12,68,124,0.6)",
            whiteSpace:"nowrap",
          }}>
            🅿 GARAJ
          </div>
          {/* Levha direği */}
          <div style={{
            position:"absolute", top:-16, left:"50%", transform:"translateX(-50%)",
            width:2, height:16, background:"#555",
          }}/>

          {/* Çatı */}
          <div style={{ position:"absolute", top:-14, left:-12, right:-12, height:20, background:"#424242", borderRadius:"5px 5px 0 0" }}/>
          {/* Duvar */}
          <div style={{ position:"absolute", top:6, left:0, right:0, bottom:0, background:"#323232" }}/>
          {/* Pencere */}
          <div style={{ position:"absolute", top:16, right:8, width:26, height:20, background:"#7ab4d8", opacity:0.5, borderRadius:2 }}/>
          <div style={{ position:"absolute", top:16, right:21, width:1, height:20, background:"#5a90b0", opacity:0.5 }}/>
          <div style={{ position:"absolute", top:26, right:8, width:26, height:1, background:"#5a90b0", opacity:0.5 }}/>
          {/* Kapı çerçevesi */}
          <div style={{ position:"absolute", bottom:0, left:13, width:2, height:82, background:"#555" }}/>
          <div style={{ position:"absolute", bottom:0, right:13, width:2, height:82, background:"#555" }}/>
          {/* Kapı */}
          <div style={{ position:"absolute", bottom:0, left:15, right:15, height:82, background:"#0a0a0a", overflow:"hidden" }}>
            <div style={{ animation:"garageDoor 9s infinite ease-in-out" }}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{
                  height:20, borderBottom:"2px solid #555",
                  background: i%2===0 ? "#585858" : "#4e4e4e"
                }}/>
              ))}
            </div>
          </div>
        </div>

        {/* Kullanıcı adı */}
        <div style={{
          position:"absolute", right:22, bottom:68, textAlign:"right",
          animation:"nameFade 9s infinite"
        }}>
          <div style={{ color:"white", fontWeight:700, fontSize:13, fontFamily:"sans-serif" }}>
            {userName}
          </div>
          <div style={{ color:"#4a5a70", fontSize:10, fontFamily:"sans-serif", marginTop:2 }}>
            garaja gidiyor →
          </div>
        </div>

        {/* ARABA 🚗 — FI mavisi (scaleX(-1) keyframe'de, label counter-flip ile okunabilir) */}
        <div style={{ position:"absolute", bottom:54, left:0, animation:"carMove 9s infinite" }}>
          <span style={{
            fontSize:30, display:"block", lineHeight:1,
            filter:"drop-shadow(0 0 8px #2a6cb8) drop-shadow(0 2px 3px rgba(42,108,184,0.4))"
          }}>🚗</span>
          <span className="garage-label" style={{
            fontSize:8, fontWeight:800, color:"#85B7EB",
            fontFamily:"monospace", letterSpacing:1, textAlign:"center"
          }}>FI</span>
        </div>

        {/* MOTOSİKLET 🏍️ — KA yeşili */}
        <div style={{ position:"absolute", bottom:56, left:0, animation:"motoMove 9s infinite" }}>
          <span style={{
            fontSize:28, display:"block", lineHeight:1,
            filter:"drop-shadow(0 0 8px #2a6a18) drop-shadow(0 2px 3px rgba(42,106,24,0.4))"
          }}>🏍️</span>
          <span className="garage-label" style={{
            fontSize:8, fontWeight:800, color:"#97C459",
            fontFamily:"monospace", letterSpacing:1, textAlign:"center"
          }}>KA</span>
        </div>

        {/* SCOOTER 🛵 — PE kırmızısı */}
        <div style={{ position:"absolute", bottom:56, left:0, animation:"scooterMove 9s infinite" }}>
          <span style={{
            fontSize:26, display:"block", lineHeight:1,
            filter:"drop-shadow(0 0 8px #982818) drop-shadow(0 2px 3px rgba(152,40,24,0.4))"
          }}>🛵</span>
          <span className="garage-label" style={{
            fontSize:8, fontWeight:800, color:"#F0997B",
            fontFamily:"monospace", letterSpacing:1, textAlign:"center"
          }}>PE</span>
        </div>
      </div>
    </>
  );
}
