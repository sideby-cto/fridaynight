const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getPlan(id) {
  const { data: plan, error: planError } = await supabase
    .from('friday_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (planError || !plan) return null

  const { data: activities, error: actError } = await supabase
    .from('plan_activities')
    .select('*')
    .eq('plan_id', id)
    .order('position', { ascending: true })

  if (actError) throw actError

  return { ...plan, activities }
}

async function getPlans(order = 'ASC') {
  const ascending = order !== 'DESC'

  const { data: plans, error: plansError } = await supabase
    .from('friday_plans')
    .select('*')
    .order('friday_date', { ascending })

  if (plansError) throw plansError
  if (!plans || plans.length === 0) return []

  const planIds = plans.map(p => p.id)

  const { data: activities, error: actError } = await supabase
    .from('plan_activities')
    .select('*')
    .in('plan_id', planIds)
    .order('position', { ascending: true })

  if (actError) throw actError

  const actsByPlanId = {}
  for (const act of activities) {
    if (!actsByPlanId[act.plan_id]) actsByPlanId[act.plan_id] = []
    actsByPlanId[act.plan_id].push(act)
  }

  return plans.map(plan => ({ ...plan, activities: actsByPlanId[plan.id] ?? [] }))
}

async function savePlan(fridayDate, activities) {
  const { data: existing } = await supabase
    .from('friday_plans')
    .select('id')
    .eq('friday_date', fridayDate)
    .maybeSingle()

  let planId

  if (existing) {
    planId = existing.id
    const { error: deleteError } = await supabase
      .from('plan_activities')
      .delete()
      .eq('plan_id', planId)

    if (deleteError) throw deleteError
  } else {
    const { data: newPlan, error: insertError } = await supabase
      .from('friday_plans')
      .insert({ friday_date: fridayDate })
      .select('id')
      .single()

    if (insertError) throw insertError
    planId = newPlan.id
  }

  const activityRows = activities.map((act, i) => ({
    plan_id: planId,
    position: i,
    emoji: act.emoji,
    title: act.title,
    time: act.time,
    description: act.description || '',
  }))

  const { error: actInsertError } = await supabase
    .from('plan_activities')
    .insert(activityRows)

  if (actInsertError) throw actInsertError

  return getPlan(planId)
}

module.exports = { getPlans, savePlan }
