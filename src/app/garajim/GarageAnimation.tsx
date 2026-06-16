"use client";

export function GarageAnimation({ userName }: { userName: string }) {
  const stars: [number, number, number][] = [
    [32,12,2],[80,6,2],[145,18,2.5],[210,9,1.5],[275,22,2],[340,7,2.5],
    [410,16,2],[470,25,2.5],[530,11,2],[600,20,2.5],[640,8,1.5],
    [60,35,1.5],[170,38,2],[290,30,1.5],[420,42,1.5],[560,36,2],[620,28,1.5],
    [100,48,1.5],[250,50,2],[400,45,1.5],[550,52,1.5],[15,28,1.5],[500,40,1.5],
  ];

  return (
    <>
      <style>{`
        @keyframes garageDoor {
          0%, 7%    { transform: translateY(0); }
          16%, 63%  { transform: translateY(-100%); }
          78%, 100% { transform: translateY(0); }
        }
        @keyframes carMove {
          0%, 7%   { transform: translateX(660px); opacity: 0; }
          11%      { transform: translateX(600px); opacity: 1; }
          25%      { transform: translateX(95px);  opacity: 1; }
          31%      { transform: translateX(55px);  opacity: 0; }
          100%     { transform: translateX(55px);  opacity: 0; }
        }
        @keyframes motoMove {
          0%, 31%  { transform: translateX(660px); opacity: 0; }
          35%      { transform: translateX(600px); opacity: 1; }
          49%      { transform: translateX(95px);  opacity: 1; }
          55%      { transform: translateX(55px);  opacity: 0; }
          100%     { transform: translateX(55px);  opacity: 0; }
        }
        @keyframes scooterMove {
          0%, 55%  { transform: translateX(660px); opacity: 0; }
          59%      { transform: translateX(600px); opacity: 1; }
          73%      { transform: translateX(95px);  opacity: 1; }
          79%      { transform: translateX(55px);  opacity: 0; }
          100%     { transform: translateX(55px);  opacity: 0; }
        }
        @keyframes nameFade {
          0%, 9%   { opacity: 1; }
          13%, 79% { opacity: 0.28; }
          85%, 100%{ opacity: 1; }
        }
        @keyframes moonPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(210,180,90,0.6), 0 0 28px rgba(210,180,90,0.2); }
          50%      { box-shadow: 0 0 20px rgba(210,180,90,0.9), 0 0 40px rgba(210,180,90,0.35); }
        }
      `}</style>

      <div
        className="relative w-full rounded-2xl overflow-hidden mb-6 select-none"
        style={{ height: 210, background: "linear-gradient(180deg, #111827 0%, #1e2d4a 100%)" }}
      >
        {/* Yıldızlar */}
        {stars.map(([x,y,r],i) => (
          <div key={i} style={{
            position:"absolute", left:x, top:y,
            width:r*2, height:r*2, borderRadius:"50%",
            background:"white",
            opacity: 0.55 + (i % 4) * 0.12,
            boxShadow: i % 4 === 0 ? `0 0 ${r*3}px rgba(255,255,255,0.8)` : undefined,
          }}/>
        ))}

        {/* Ay */}
        <div style={{
          position:"absolute", right:58, top:18,
          width:36, height:36, borderRadius:"50%",
          background:"radial-gradient(circle at 38% 38%, #f8f0c8, #d4b860)",
          animation:"moonPulse 4s ease-in-out infinite",
        }}>
          {/* Hilal gölgesi */}
          <div style={{
            position:"absolute", right:-5, top:6,
            width:30, height:26, borderRadius:"50%",
            background:"#1a2540",
          }}/>
        </div>

        {/* Yol */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:54, background:"#222" }}>
          <div style={{
            position:"absolute", top:"40%", left:0, right:0, height:3,
            backgroundImage:"repeating-linear-gradient(to right, #444 0px, #444 26px, transparent 26px, transparent 54px)"
          }}/>
        </div>

        {/* Garaj yapısı */}
        <div style={{ position:"absolute", left:36, bottom:54, width:126, height:112 }}>
          {/* Çatı */}
          <div style={{ position:"absolute", top:-14, left:-12, right:-12, height:20, background:"#484848", borderRadius:"5px 5px 0 0" }}/>
          {/* Duvar */}
          <div style={{ position:"absolute", top:6, left:0, right:0, bottom:0, background:"#363636" }}/>
          {/* Pencere */}
          <div style={{ position:"absolute", top:16, right:8, width:26, height:20, background:"#7ab4d8", opacity:0.5, borderRadius:2 }}/>
          <div style={{ position:"absolute", top:16, right:21, width:1, height:20, background:"#5a90b0", opacity:0.5 }}/>
          <div style={{ position:"absolute", top:26, right:8, width:26, height:1, background:"#5a90b0", opacity:0.5 }}/>
          {/* Kapı çerçevesi */}
          <div style={{ position:"absolute", bottom:0, left:13, width:2, height:82, background:"#555" }}/>
          <div style={{ position:"absolute", bottom:0, right:13, width:2, height:82, background:"#555" }}/>
          {/* Kapı açıklığı */}
          <div style={{ position:"absolute", bottom:0, left:15, right:15, height:82, background:"#0d0d0d", overflow:"hidden" }}>
            <div style={{ animation:"garageDoor 9s infinite ease-in-out" }}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{
                  height:20, borderBottom:"2px solid #606060",
                  background: i%2===0 ? "#5e5e5e" : "#545454"
                }}/>
              ))}
            </div>
          </div>
        </div>

        {/* Kullanıcı adı */}
        <div style={{
          position:"absolute", right:22, bottom:70, textAlign:"right",
          animation:"nameFade 9s infinite"
        }}>
          <div style={{ color:"white", fontWeight:700, fontSize:13, fontFamily:"sans-serif" }}>
            {userName}
          </div>
          <div style={{ color:"#556", fontSize:10, fontFamily:"sans-serif", marginTop:2 }}>
            garaja gidiyor →
          </div>
        </div>

        {/* ARABA — FI mavi */}
        <div style={{ position:"absolute", bottom:54, left:0, animation:"carMove 9s infinite" }}>
          <div style={{ position:"relative" }}>
            <span style={{
              fontSize:30, display:"block", transform:"scaleX(-1)", lineHeight:1,
              filter:"drop-shadow(0 0 7px #3a7cc4) drop-shadow(0 2px 4px rgba(58,124,196,0.5))"
            }}>🚗</span>
            <span style={{
              position:"absolute", bottom:-11, left:"50%", transform:"translateX(-50%)",
              fontSize:8, fontWeight:800, color:"#85B7EB", fontFamily:"monospace", letterSpacing:1
            }}>FI</span>
          </div>
        </div>

        {/* MOTOSİKLET — KA yeşil */}
        <div style={{ position:"absolute", bottom:56, left:0, animation:"motoMove 9s infinite" }}>
          <div style={{ position:"relative" }}>
            <span style={{
              fontSize:27, display:"block", transform:"scaleX(-1)", lineHeight:1,
              filter:"drop-shadow(0 0 7px #3a7a1a) drop-shadow(0 2px 4px rgba(58,122,26,0.5))"
            }}>🏍️</span>
            <span style={{
              position:"absolute", bottom:-11, left:"50%", transform:"translateX(-50%)",
              fontSize:8, fontWeight:800, color:"#97C459", fontFamily:"monospace", letterSpacing:1
            }}>KA</span>
          </div>
        </div>

        {/* SCOOTER — PE kırmızı */}
        <div style={{ position:"absolute", bottom:56, left:0, animation:"scooterMove 9s infinite" }}>
          <div style={{ position:"relative" }}>
            <span style={{
              fontSize:25, display:"block", transform:"scaleX(-1)", lineHeight:1,
              filter:"drop-shadow(0 0 7px #a03828) drop-shadow(0 2px 4px rgba(160,56,40,0.5))"
            }}>🛵</span>
            <span style={{
              position:"absolute", bottom:-11, left:"50%", transform:"translateX(-50%)",
              fontSize:8, fontWeight:800, color:"#F0997B", fontFamily:"monospace", letterSpacing:1
            }}>PE</span>
          </div>
        </div>
      </div>
    </>
  );
}
