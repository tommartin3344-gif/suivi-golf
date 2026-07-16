const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const authHeader = event.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Non authentifié' }) };
    }

    // Récupère ou crée le customer Stripe associé à cet utilisateur
    const { data: abonnement } = await supabaseAdmin
      .from('abonnements')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = abonnement?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from('abonnements')
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' });
    }

    const origin = event.headers.origin || `https://${event.headers.host}`;
    const trialDays = Number(process.env.STRIPE_TRIAL_DAYS || '7');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: trialDays > 0 ? { trial_period_days: trialDays } : undefined,
      success_url: `${origin}/?abonnement=succes`,
      cancel_url: `${origin}/?abonnement=annule`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
