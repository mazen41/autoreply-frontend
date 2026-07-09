'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function PricingCalculator() {
  const [productCost, setProductCost] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [adSpend, setAdSpend] = useState('')
  const [profitMargin, setProfitMargin] = useState('30')

  const calculations = useMemo(() => {
    const cost = parseFloat(productCost) || 0
    const shipping = parseFloat(shippingCost) || 0
    const ad = parseFloat(adSpend) || 0
    const margin = parseFloat(profitMargin) || 0

    const totalCost = cost + shipping + ad
    const recommendedPrice = totalCost / (1 - margin / 100)
    const profitPerUnit = recommendedPrice - totalCost
    const actualMargin = (profitPerUnit / recommendedPrice) * 100

    // Break-even: how many units to cover fixed costs (assuming $1000 fixed costs for example)
    const fixedCosts = 1000
    const breakEvenUnits = Math.ceil(fixedCosts / profitPerUnit) || 0

    return {
      recommendedPrice: recommendedPrice.toFixed(2),
      profitPerUnit: profitPerUnit.toFixed(2),
      actualMargin: actualMargin.toFixed(1),
      breakEvenUnits,
      totalCost: totalCost.toFixed(2),
    }
  }, [productCost, shippingCost, adSpend, profitMargin])

  return (
    <div>
      {/* Info Banner */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(198,255,0,0.05)', border: '1px solid rgba(198,255,0,0.15)' }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          This calculator helps you determine the optimal selling price for your products
        </p>
      </div>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            تكلفة المنتج / Product Cost ($)
          </label>
          <input
            type="number"
            value={productCost}
            onChange={(e) => setProductCost(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            تكلفة الشحن / Shipping Cost ($)
          </label>
          <input
            type="number"
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            الإعلان لكل وحدة / Ad Spend per Unit ($)
          </label>
          <input
            type="number"
            value={adSpend}
            onChange={(e) => setAdSpend(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            هامش الربح المطلوب / Desired Profit Margin (%)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              min="10"
              max="80"
              step="5"
              className="flex-1"
            />
            <input
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              min="10"
              max="80"
              className="w-20 px-3 py-2 rounded-lg text-sm text-center outline-none"
              style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl"
        style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <h3 className="font-bold mb-4" style={{ color: '#F5F5F5' }}>النتائج / Results</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg" style={{ background: 'rgba(198,255,0,0.05)', border: '1px solid rgba(198,255,0,0.2)' }}>
            <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>السعر المقترح / Recommended Price</div>
            <div className="text-2xl font-bold" style={{ color: '#C6FF00' }}>${calculations.recommendedPrice}</div>
          </div>
          
          <div className="p-4 rounded-lg" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>الربح لكل وحدة / Profit per Unit</div>
            <div className="text-2xl font-bold" style={{ color: '#F5F5F5' }}>${calculations.profitPerUnit}</div>
          </div>
          
          <div className="p-4 rounded-lg" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>هامش الربح الفعلي / Actual Margin</div>
            <div className="text-2xl font-bold" style={{ color: '#F5F5F5' }}>{calculations.actualMargin}%</div>
          </div>
          
          <div className="p-4 rounded-lg" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>نقطة التعادل / Break-even Units</div>
            <div className="text-2xl font-bold" style={{ color: '#F5F5F5' }}>{calculations.breakEvenUnits}</div>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>إجمالي التكلفة / Total Cost per Unit</div>
              <div className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>${calculations.totalCost}</div>
            </div>
            <div className="text-right">
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>تكلفة المنتج + الشحن + الإعلان</div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                ${(parseFloat(productCost) || 0).toFixed(2)} + ${(parseFloat(shippingCost) || 0).toFixed(2)} + ${(parseFloat(adSpend) || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Upsell CTA */}
        <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'rgba(198,255,0,0.05)', border: '1px solid rgba(198,255,0,0.15)' }}>
          <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
            هل تريد أن يرد الذكاء الاصطناعي على عملائك تلقائياً؟ جرّب Naz Autoreply مجاناً
          </p>
          <Link href="/register" className="inline-block px-4 py-2 rounded-lg text-sm font-bold"
            style={{ background: '#C6FF00', color: '#050505' }}>
            جرّب مجاناً
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
