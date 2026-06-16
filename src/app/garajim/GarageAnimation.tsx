"use client";

export function GarageAnimation({ userName }: { userName: string }) {
  return (
    <>
      <style>{`
        @keyframes garageDoor {
          0%, 7%    { transform: translateY(0); }
          16%, 56%  { transform: translateY(-100%); }
          65%, 100% { transform: translateY(0); }
        }
        @keyframes carMove {
          0%, 7%   { transform: translateX(0);     opacity: 0; }
          11%      { transform: translateX(-20px);  opacity: 1; }
          24%      { transform: translateX(-460px); opacity: 1; }
          29%      { transform: translateX(-520px); opacity: 0; }
          100%     { transform: translateX(-520px); opacity: 0; }
        }
        @keyframes motoMove {
          0%, 29%  { transform: translateX(0);     opacity: 0; }
          33%      { transform: translateX(-20px);  opacity: 1; }
          46%      { transform: translateX(-460px); opacity: 1; }
          51%      { transform: translateX(-520px); opacity: 0; }
          100%     { transform: translateX(-520px); opacity: 0; }
        }
        @keyframes scooterMove {
          0%, 51%  { transform: translateX(0);     opacity: 0; }
          55%      { transform: translateX(-20px);  opacity: 1; }
          68%      { transform: translateX(-460px); opacity: 1; }
          73%      { transform: translateX(-520px); opacity: 0; }
          100%     { transform: translateX(-520px); opacity: 0; }
        }
        @keyframes nameFade {
          0%, 9%   { opacity: 1; }
          13%, 73% { opacity: 0.3; }
          79%, 100%{ opacity: 1; }
        }
      `}</style>

      <div
        className="relative w-full rounded-2xl overflow-hidden mb-6 select-none"
        style={{ height: 200, background: "linear-gradient(180deg,#0d1117 0%,#1a1a2e 100%)" }}
      >
        {/* Yıldızlar */}
        {([
          [32,12],[80,6],[145,18],[210,9],[275,22],[340,7],[410,16],
          [470,25],[530,11],[600,20],[60,35],[170,38],[290,30],[420,42],
          [560,36],[620,28],[100,48],[250,50],[400,45],[550,52],
        ] as [number,number][]).map(([x,y],i) => (
          <div key={i} style={{
            position:"absolute", left:x, top:y, width:2, height:2,
            borderRadius:"50%", background:"white", opacity:0.3+(i%3)*0.15
          }}/>
        ))}

        {/* Yol */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:52, background:"#252525" }}>
          <div style={{
            position:"absolute", top:"42%", left:0, right:0, height:3,
            backgroundImage:"repeating-linear-gradient(to right,#484848 0px,#484848 24px,transparent 24px,transparent 52px)"
          }}/>
        </div>

        {/* Garaj yapısı */}
        <div style={{ position:"absolute", left:36, bottom:52, width:126, height:112 }}>
          {/* Çatı */}
          <div style={{ position:"absolute", top:-13, left:-10, right:-10, height:19, background:"#484848", borderRadius:"5px 5px 0 0" }}/>
          {/* Duvar */}
          <div style={{ position:"absolute", top:6, left:0, right:0, bottom:0, background:"#363636" }}/>
          {/* Pencere */}
          <div style={{ position:"absolute", top:16, right:8, width:26, height:20, background:"#7ab4d8", opacity:0.45, borderRadius:2 }}/>
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
              {/* Tutamaç */}
              <div style={{ position:"absolute", left:"50%", top:38, transform:"translateX(-50%)", width:12, height:5, background:"#888", borderRadius:3 }}/>
            </div>
          </div>
        </div>

        {/* Kullanıcı adı etiketi */}
        <div style={{
          position:"absolute", right:22, bottom:66, textAlign:"right",
          animation:"nameFade 9s infinite"
        }}>
          <div style={{ color:"white", fontWeight:700, fontSize:13, fontFamily:"sans-serif", letterSpacing:-0.3 }}>
            {userName}
          </div>
          <div style={{ color:"#555", fontSize:10, fontFamily:"sans-serif", marginTop:2 }}>
            garaja gidiyor →
          </div>
        </div>

        {/* ARABA 🚗 */}
        <div style={{ position:"absolute", right:14, bottom:51, animation:"carMove 9s infinite" }}>
          <div style={{ fontSize:30, transform:"scaleX(-1)", lineHeight:1 }}>🚗</div>
        </div>

        {/* MOTOSİKLET 🏍️ */}
        <div style={{ position:"absolute", right:14, bottom:53, animation:"motoMove 9s infinite" }}>
          <div style={{ fontSize:27, transform:"scaleX(-1)", lineHeight:1 }}>🏍️</div>
        </div>

        {/* SCOOTER 🛵 */}
        <div style={{ position:"absolute", right:14, bottom:53, animation:"scooterMove 9s infinite" }}>
          <div style={{ fontSize:25, transform:"scaleX(-1)", lineHeight:1 }}>🛵</div>
        </div>
      </div>
    </>
  );
}
