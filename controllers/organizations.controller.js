const Controller = require('./Controller.js')(`Organizations`);
const { UsersModel, OrganizationsModel, MeetingsModel, SessionsModel } = require('../models');
const validate = require('../middleware/validations');


class OrganizationsController extends Controller {
	constructor(){
		super()
	};

	static index(req, res, next) {
		OrganizationsModel.index()
			.then(orgs => res.status(200).json(orgs))
			.catch(err => next(err));
	};

	static indexOrgUsers(req, res, next) {
		OrganizationsModel.show(req.params.id)
			.then(() => OrganizationsModel.indexOrgUsers(req.params.id))
			.then(data => res.status(200).json(data))
			.catch(err => next(err));
	};

	static showOrgUser(req, res, next) {
		OrganizationsModel.show(req.params.id)
			.then(() => UsersModel.show(req.params.uid))		
			.then(() => OrganizationsModel.showOrgUser(req.params.uid, req.params.id))
			.then(data => res.status(201).json(data))
			.catch(err => next(err));
	};

	static show(req, res, next) {
		let organization;
		OrganizationsModel.show(req.params.id)
			.then(org => {
				organization = org
				return SessionsModel.index(organization.id)
			})
			.then(sessions => {
				organization.sessions = sessions
				return Promise.all(organization.sessions.map((session) => {
					return MeetingsModel.index(organization.id, session.id)
						.then(meetings => {
							session.meetings = meetings
							return Promise.all(session.meetings.map((meeting) => {
								return UsersModel.getUserById(meeting.member_id)
									.then(member => {
										meeting.member = member || {}
										if (meeting.member.hashed_password !== undefined) delete meeting.member.hashed_password
										return meeting
									})
							}))
						})
				}))
			})
			.then(() => OrganizationsModel.indexOrgUsers(organization.id))
			.then((users) => {
				organization.users = users
				res.status(201).json(organization)
			})
			.catch(err => next(err));
	};

	static addOrgUser(req, res, next) {
		validate.createOrgUser(req.params.id, req.body)
			.then(() => OrganizationsModel.show(req.params.id))
			.then(() => UsersModel.show(req.body.user_id))		
			.then(() => OrganizationsModel.getOrgUser(req.body.user_id, req.params.id))
			.then(user => {
				if (user !== undefined) throw new Error('userOrgRelationExists')
				return OrganizationsModel.addOrgUser(req.body)
			})
			.then(data => res.status(201).json(data))
			.catch(err => next(err));
	};

	static updateOrgUser(req, res, next) {
		validate.updateOrgUser(req.body)
			.then(() => OrganizationsModel.showOrgUser(req.params.uid, req.params.id))
			.then(() => OrganizationsModel.updateOrgUser(req.params.uid, req.params.id, req.body))
			.then(data => res.status(201).json(data))
			.catch(err => next(err));
	};

	static isValidOrgCreate(req, res, next) {
		validate.organizationCreate(req.body)
			.then(() =>  UsersModel.show(req.body.organizer_id))
			.then(() => OrganizationsModel.getOrgByName(req.body.name))
			.then(org => {
				if (org !== undefined) throw new Error('alreadyOrg')
				next()
			})
			.catch(err => next(err));
	};

	static isValidOrgPatch(req, res, next) {
		validate.orgUpdate(req.body)
			.then(() => OrganizationsModel.show(req.params.id))
			.then(() => OrganizationsModel.update(req.params.id, req.body))
			.then(data => res.status(201).json(data))
			.catch(err => next(err));
	};

	static removeOrgUser(req, res, next) {
		OrganizationsModel.showOrgUser(req.params.uid, req.params.id)
			.then(() => OrganizationsModel.removeOrgUser(req.params.uid, req.params.id))
			.then(data => res.status(201).json(data))
			.catch(err => next(err));
	};

};


module.exports = OrganizationsController;
