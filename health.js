module.exports = async (req, res) => {
  res.status(200).json({ ok: true, googlePlacesConfigured: Boolean(process.env.GOOGLE_PLACES_API_KEY) });
};
