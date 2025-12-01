
import React, { useState, useMemo } from 'react';
import { MarketTrendAnalysis, RegressionResult, MarketDataPoint } from '../types';
import { analyzeMarketTrends } from '../services/geminiService';

// --- Linear Regression Logic (Client-Side) ---
// Calculates y = mx + b and r^2
const calculateLinearRegression = (data: MarketDataPoint[]): RegressionResult => {
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    data.forEach(point => {
        sumX += point.year;
        sumY += point.salary;
        sumXY += (point.year * point.salary);
        sumXX += (point.year * point.year);
        sumYY += (point.salary * point.salary);
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-Squared Calculation
    const rNumerator = (n * sumXY - sumX * sumY);
    const rDenominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const rSquared = Math.pow(rNumerator / rDenominator, 2);

    const predictionNextYear = slope * (new Date().getFullYear() + 1) + intercept;
    const predictionTwoYears = slope * (new Date().getFullYear() + 2) + intercept;

    return {
        slope,
        intercept,
        rSquared,
        predictionNextYear,
        predictionTwoYears,
        trendDirection: slope > 0.5 ? 'Positive' : slope < -0.5 ? 'Negative' : 'Stable'
    };
};

export const MarketAnalysisSection: React.FC = () => {
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('');
    const [analysis, setAnalysis] = useState<MarketTrendAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [regression, setRegression] = useState<RegressionResult | null>(null);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role || !location) return;

        setIsLoading(true);
        setAnalysis(null);
        setRegression(null);

        try {
            const result = await analyzeMarketTrends(role, location);
            setAnalysis(result);
            
            // Perform Regression on the historical data returned by AI
            if (result.historicalData.length > 0) {
                const regResult = calculateLinearRegression(result.historicalData);
                setRegression(regResult);
            }
        } catch (error) {
            console.error("Market analysis failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Chart Rendering Logic ---
    const chartData = useMemo(() => {
        if (!analysis || !regression) return null;
        
        // Combine history + predictions
        const currentYear = new Date().getFullYear();
        const history = analysis.historicalData.sort((a,b) => a.year - b.year);
        
        // Generate projected points
        const futureYears = [currentYear + 1, currentYear + 2];
        const projections = futureYears.map(year => ({
            year,
            salary: regression.slope * year + regression.intercept,
            isProjection: true
        }));

        const allPoints = [...history.map(p => ({...p, isProjection: false})), ...projections];
        
        // Scaling for SVG
        const minYear = Math.min(...allPoints.map(p => p.year));
        const maxYear = Math.max(...allPoints.map(p => p.year));
        const minSal = Math.min(...allPoints.map(p => p.salary)) * 0.9;
        const maxSal = Math.max(...allPoints.map(p => p.salary)) * 1.1;
        
        const width = 600;
        const height = 300;
        const padding = 40;

        const getX = (year: number) => padding + ((year - minYear) / (maxYear - minYear)) * (width - 2 * padding);
        const getY = (sal: number) => height - padding - ((sal - minSal) / (maxSal - minSal)) * (height - 2 * padding);

        return { allPoints, getX, getY, width, height, minSal, maxSal };
    }, [analysis, regression]);

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg animate-fade-in min-h-[600px]">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                    Market Technical Analysis
                </h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                    Leverage <strong>Linear Regression algorithms</strong> to forecast salary trends and skill demand for your target role. 
                    Get a statistical advantage in your career planning.
                </p>
            </div>

            <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto mb-10">
                <input 
                    type="text" 
                    placeholder="Target Role (e.g. Full Stack Developer)" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex-grow bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    required
                />
                <input 
                    type="text" 
                    placeholder="Location (e.g. Bangalore, Hyderabad)" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-grow bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    required
                />
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-md transition-colors shadow-lg flex-shrink-0"
                >
                    {isLoading ? 'Analyzing...' : 'Run Regression'}
                </button>
            </form>

            {analysis && regression && chartData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    
                    {/* Main Chart Section */}
                    <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6 border border-slate-700 relative overflow-hidden">
                        <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                            Salary Regression Forecast ({analysis.currency})
                        </h3>
                        
                        <div className="w-full overflow-x-auto">
                            <svg width={chartData.width} height={chartData.height} className="mx-auto">
                                {/* Axes */}
                                <line x1="40" y1={chartData.height - 40} x2={chartData.width - 20} y2={chartData.height - 40} stroke="#475569" strokeWidth="2" />
                                <line x1="40" y1="20" x2="40" y2={chartData.height - 40} stroke="#475569" strokeWidth="2" />
                                
                                {/* Regression Line */}
                                <line 
                                    x1={chartData.getX(chartData.allPoints[0].year)} 
                                    y1={chartData.getY(regression.slope * chartData.allPoints[0].year + regression.intercept)}
                                    x2={chartData.getX(chartData.allPoints[chartData.allPoints.length - 1].year)}
                                    y2={chartData.getY(regression.slope * chartData.allPoints[chartData.allPoints.length - 1].year + regression.intercept)}
                                    stroke="#c084fc" 
                                    strokeWidth="3" 
                                    strokeDasharray="5,5"
                                />

                                {/* Data Points & Labels */}
                                {chartData.allPoints.map((p, i) => (
                                    <g key={i}>
                                        <circle 
                                            cx={chartData.getX(p.year)} 
                                            cy={chartData.getY(p.salary)} 
                                            r={p.isProjection ? 6 : 4} 
                                            fill={p.isProjection ? "#e879f9" : "#38bdf8"} 
                                            stroke="#0f172a" 
                                            strokeWidth="2"
                                        />
                                        <text x={chartData.getX(p.year)} y={chartData.height - 20} textAnchor="middle" fill="#94a3b8" fontSize="12">{p.year}</text>
                                        <text x={chartData.getX(p.year)} y={chartData.getY(p.salary) - 10} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                                            {p.salary.toFixed(1)}
                                        </text>
                                    </g>
                                ))}
                            </svg>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center text-xs text-slate-400 bg-slate-800/50 p-3 rounded">
                            <span>Equation: <code className="text-purple-300">y = {regression.slope.toFixed(2)}x {regression.intercept >= 0 ? '+' : '-'} {Math.abs(regression.intercept).toFixed(2)}</code></span>
                            <span>R² Correlation: <code className="text-green-300">{regression.rSquared.toFixed(3)}</code></span>
                        </div>
                    </div>

                    {/* Insights Panel */}
                    <div className="space-y-6">
                        {/* Forecast Box */}
                        <div className="bg-gradient-to-br from-purple-900/50 to-slate-900 border border-purple-500/30 rounded-xl p-6">
                            <h4 className="text-sm font-bold text-purple-200 uppercase mb-2">Future Advantage</h4>
                            <p className="text-3xl font-bold text-white mb-1">
                                {regression.predictionTwoYears.toFixed(1)} <span className="text-sm font-normal text-slate-400">{analysis.currency}</span>
                            </p>
                            <p className="text-xs text-slate-300 mb-4">Projected Market Rate in 2026</p>
                            
                            <div className={`text-sm font-bold px-3 py-1 rounded w-max ${regression.trendDirection === 'Positive' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                Trend: {regression.trendDirection}
                            </div>
                        </div>

                        {/* Skills Analysis */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                            <h4 className="text-sm font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">Skill Arbitrage</h4>
                            
                            <div className="mb-4">
                                <p className="text-xs text-green-400 mb-2 font-bold uppercase">Accumulate (Rising Demand)</p>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.emergingSkills.map(skill => (
                                        <span key={skill} className="text-xs bg-green-900/30 text-green-200 border border-green-800 px-2 py-1 rounded">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-red-400 mb-2 font-bold uppercase">Divest (Falling Demand)</p>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.decliningSkills.map(skill => (
                                        <span key={skill} className="text-xs bg-red-900/30 text-red-200 border border-red-800 px-2 py-1 rounded line-through opacity-70">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {!isLoading && !analysis && (
                <div className="text-center py-20 opacity-50">
                    <div className="w-16 h-16 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin mx-auto mb-4 opacity-0"></div>
                    <p className="text-lg">Enter role details to generate regression model.</p>
                </div>
            )}
        </div>
    );
};
