const express = require('express');
const router = express.Router();

const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

const authCtrl = require('../controllers/authController');
const listingCtrl = require('../controllers/listingController');
const visitCtrl = require('../controllers/visitController');
const userCtrl = require('../controllers/userController');
const favCtrl = require('../controllers/favoriteController');
const settingsCtrl = require('../controllers/settingsController');
const vehicleCtrl = require('../controllers/vehicleController');
const uploadCtrl = require('../controllers/uploadController');
const upload = require('../middleware/upload');

// ========== UPLOAD PHOTOS ==========
router.post('/upload', authenticate, upload.array('images', 10), uploadCtrl.uploadImages);

// ========== AUTH ==========
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.me);

// ========== SETTINGS (public) ==========
router.get('/settings', settingsCtrl.getPublicSettings);
router.post('/support', authenticate, settingsCtrl.contactSupport);

// ========== LISTINGS – Bailleur (routes spécifiques AVANT :id) ==========
router.post('/listings/submit', authenticate, requireRole('LANDLORD'), listingCtrl.submitListing);
router.get('/listings/my/submissions', authenticate, requireRole('LANDLORD'), listingCtrl.mySubmissions);
router.put('/listings/:id', authenticate, requireRole('LANDLORD'), listingCtrl.updateMyListing);
router.delete('/listings/:id', authenticate, requireRole('LANDLORD'), listingCtrl.deleteMyListing);

// ========== LISTINGS – Locataire ==========
router.get('/listings', optionalAuth, listingCtrl.getPublishedListings); // public + optionnel auth
router.get('/listings/:id', optionalAuth, listingCtrl.getListingById);

// ========== VISITES / PAIEMENT ==========
router.post('/visits/initiate', authenticate, requireRole('TENANT'), visitCtrl.initiatePayment);
router.get('/visits/status/:transactionId', authenticate, requireRole('TENANT'), visitCtrl.checkPaymentStatus);
router.post('/visits/confirm-simulation', authenticate, requireRole('TENANT'), visitCtrl.confirmSimulation);
router.post('/visits/webhook', visitCtrl.campayWebhook); // public – Campay callback
router.post('/visits/unlock', authenticate, requireRole('TENANT'), visitCtrl.unlockListing);
router.get('/visits/my-unlocks', authenticate, requireRole('TENANT'), visitCtrl.myUnlocks);

// ========== FAVORIS ==========
router.post('/favorites', authenticate, requireRole('TENANT'), favCtrl.addFavorite);
router.delete('/favorites/:listingId', authenticate, requireRole('TENANT'), favCtrl.removeFavorite);
router.get('/favorites', authenticate, requireRole('TENANT'), favCtrl.getFavorites);

// ========== ADMIN ==========
router.get('/admin/stats', authenticate, requireRole('ADMIN'), userCtrl.getStats);
router.get('/admin/landlords', authenticate, requireRole('ADMIN'), userCtrl.getLandlords);
router.get('/admin/tenants', authenticate, requireRole('ADMIN'), userCtrl.getTenants);

router.get('/admin/submissions', authenticate, requireRole('ADMIN'), listingCtrl.getPendingSubmissions);
router.patch('/admin/listings/:id/approve', authenticate, requireRole('ADMIN'), listingCtrl.approveListing);
router.patch('/admin/listings/:id/reject', authenticate, requireRole('ADMIN'), listingCtrl.rejectListing);
router.get('/admin/listings', authenticate, requireRole('ADMIN'), listingCtrl.adminGetListings);
router.post('/admin/listings', authenticate, requireRole('ADMIN'), listingCtrl.createPublishedListing);
router.delete('/admin/listings/:id', authenticate, requireRole('ADMIN'), listingCtrl.adminDeleteListing);

router.get('/admin/visits', authenticate, requireRole('ADMIN'), visitCtrl.adminGetVisits);
router.delete('/admin/visits/:id', authenticate, requireRole('ADMIN'), visitCtrl.adminDeleteVisit);
router.delete('/admin/visits', authenticate, requireRole('ADMIN'), visitCtrl.adminClearVisits);

router.get('/admin/settings', authenticate, requireRole('ADMIN'), settingsCtrl.getAdminSettings);
router.put('/admin/settings', authenticate, requireRole('ADMIN'), settingsCtrl.updateSettings);
router.post('/admin/notifications', authenticate, requireRole('ADMIN'), settingsCtrl.sendNotifications);


// Vehicles (chauffeurs)
router.post('/vehicles/submit', authenticate, requireRole('DRIVER'), vehicleCtrl.submit);
router.get('/vehicles/my/submissions', authenticate, requireRole('DRIVER'), vehicleCtrl.mySubmissions);
router.get('/vehicles', optionalAuth, vehicleCtrl.published);
router.get('/admin/vehicles', authenticate, requireRole('ADMIN'), vehicleCtrl.adminList);
router.patch('/admin/vehicles/:id/approve', authenticate, requireRole('ADMIN'), vehicleCtrl.approve);
router.patch('/admin/vehicles/:id/reject', authenticate, requireRole('ADMIN'), vehicleCtrl.reject);

module.exports = router;
