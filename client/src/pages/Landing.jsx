import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Leaf, ArrowRight, Heart, Truck, ShieldCheck, BarChart3, Users, Package } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate(createPageUrl("RoleSelection"));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">FoodBridge</span>
          </div>
          <button
            onClick={handleGetStarted}
            className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              AI-Powered Food Redistribution
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              Rescue surplus food.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Nourish communities.
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-lg mx-auto">
              Connect food providers with NGOs through intelligent matching, real-time tracking, and AI-driven expiry predictions.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleGetStarted}
                className="px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center gap-2"
              >
                Start Donating <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleGetStarted}
                className="px-8 py-3.5 bg-white text-gray-700 font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-all"
              >
                I'm an NGO
              </button>
            </div>
          </motion.div>

          {/* Hero image */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-16 max-w-4xl mx-auto">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-8 md:p-12 border border-emerald-100">
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                    <Package className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">12.4K</p>
                  <p className="text-xs text-gray-500 mt-1">Meals Saved</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">340+</p>
                  <p className="text-xs text-gray-500 mt-1">Active Partners</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                    <Heart className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">98%</p>
                  <p className="text-xs text-gray-500 mt-1">Success Rate</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">How it works</h2>
            <p className="text-gray-500 mt-3 max-w-md mx-auto">Three simple steps to rescue surplus food and feed those in need</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Package, title: "List Surplus Food", desc: "Providers list their excess food with details. AI predicts expiry to set urgency.", color: "emerald" },
              { icon: Truck, title: "Smart Matching", desc: "Nearby NGOs get notified. AI recommends the best matches based on proximity and capacity.", color: "blue" },
              { icon: Heart, title: "Deliver & Track", desc: "NGOs schedule pickup, track delivery in real-time, and confirm with proof of delivery.", color: "amber" },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="bg-white rounded-2xl p-7 border border-gray-100 h-full hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 bg-${step.color}-100 rounded-xl flex items-center justify-center`}>
                      <step.icon className={`w-5 h-5 text-${step.color}-600`} />
                    </div>
                    <span className="text-xs font-bold text-gray-400">STEP {i + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Powered by AI</h2>
            <p className="text-gray-500 mt-3">Intelligent features that make food redistribution efficient and safe</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: "Expiry Prediction", desc: "AI estimates food shelf life based on type and storage conditions" },
              { icon: ShieldCheck, title: "Fraud Detection", desc: "Automated alerts for suspicious patterns and cancellations" },
              { icon: Users, title: "NGO Matching", desc: "Smart recommendations based on proximity, capacity, and trust score" },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-md transition-shadow">
                <f.icon className="w-8 h-8 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-900">FoodBridge</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 FoodBridge. AI-Powered Surplus Food Redistribution Platform.</p>
        </div>
      </footer>
    </div>
  );
}