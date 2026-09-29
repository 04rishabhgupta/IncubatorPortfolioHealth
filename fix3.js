const fs = require('fs');

// Fix globals.css
let css = fs.readFileSync('src/app/globals.css', 'utf8');
css = css.replace("@import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700,900&display=swap');\n\n", "");
css = "@import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700,900&display=swap');\n" + css;
fs.writeFileSync('src/app/globals.css', css);

// Fix portfolio page
let tsx = fs.readFileSync('src/app/(authenticated)/portfolio/page.tsx', 'utf8');
tsx = tsx.replace('const burnRevData: any[] = [];', '// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const burnRevData: any[] = [];');
tsx = tsx.replace('runwayValues.forEach((r, idx) => {', 'runwayValues.forEach(r => {');

// Put back the other 4 KPI cards
let replaceStr = `            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-[#E3E7E0] rounded-full text-[#144B3B]"><IndianRupee size={24} /></div>
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Disbursed</div>
                  <div className="text-2xl font-black text-black">{formatINR(totalDisbursed)}</div>
                  <div className="text-[10px] text-black/60 mt-0.5">of {formatINR(totalSanctioned)}</div>
                </div>
              </CardContent>
            </Card>
          </div>`;

let newStr = `            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-[#E3E7E0] rounded-full text-[#144B3B]"><IndianRupee size={24} /></div>
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Disbursed</div>
                  <div className="text-2xl font-black text-black">{formatINR(totalDisbursed)}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Median Runway</div>
                  <div className="text-3xl font-black text-black">{medianRunway.toFixed(1)}m</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Runway < 3m</div>
                  <div className={\`text-3xl font-black \${runwayUnder3 > 0 ? 'text-[#B42318]' : 'text-black'}\`}>{runwayUnder3}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Pending Subs</div>
                  <div className="text-3xl font-black text-black">{pendingSubmissions}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Assessments</div>
                  <div className="text-3xl font-black text-black">{awaitingAssessments}</div>
                </div>
              </CardContent>
            </Card>
          </div>`;

tsx = tsx.replace(replaceStr, newStr);

fs.writeFileSync('src/app/(authenticated)/portfolio/page.tsx', tsx);
