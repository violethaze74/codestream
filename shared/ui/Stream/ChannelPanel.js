import React, { Component } from "react";
import { connect } from "react-redux";
import createClassString from "classnames";
import _ from "underscore";
import {
	changeStreamMuteState,
	closeDirectMessage,
	createStream,
	setCurrentStream
} from "./actions";
import {
	getChannelStreamsForTeam,
	getDirectMessageStreamsForTeam,
	getServiceStreamsForTeam,
	getDMName
} from "../reducers/streams";
import { isActiveMixin, mapFilter, toMapBy } from "../utils";
import Icon from "./Icon";
import Tooltip from "./Tooltip";
import Debug from "./Debug";
import ChannelMenu from "./ChannelMenu";

export class SimpleChannelPanel extends Component {
	constructor(props) {
		super(props);

		this.state = {
			expanded: {
				teamChannels: true,
				directMessages: true,
				liveShareSessions: true,
				unreads: true
			}
		};
		this._channelPanel = React.createRef();
	}

	isActive = isActiveMixin("channels", this.constructor.name);

	shouldComponentUpdate(nextProps) {
		return this.isActive(this.props, nextProps);
	}

	render() {
		const teamName = this.props.team ? this.props.team.name : "";

		const channelPanelClass = createClassString({
			panel: true,
			"channel-panel": true,
			shrink: this.props.activePanel !== "channels"
		});

		return (
			<div className={channelPanelClass} ref={this._channelPanel}>
				<div className="panel-header">
					<span className="panel-title">{teamName}</span>
				</div>
				<div className="shadow-overlay">
					<div className="shadow-container">
						<div className="shadow shadow-top" />
						<div className="shadow shadow-bottom" />
					</div>
					<div className="channel-list vscroll">
						{this.renderUnreadChannels()}
						{this.renderTeamChannels()}
						{this.renderDirectMessages()}
						{this.renderServiceChannels()}
						<div className="shadow-cover-bottom" />
					</div>
				</div>
			</div>
		);
	}

	toggleSection = (e, section) => {
		e.stopPropagation();
		this.setState({
			expanded: { ...this.state.expanded, [section]: !this.state.expanded[section] }
		});
	};

	renderUnreadChannels = () => {
		return;
		// return (
		// 	<div className="section">
		// 		<div className="header">
		// 			<Tooltip title="All Channels With Unread Messages" placement="left" delay="0.5">
		// 				<span className="clickable">UNREADS</span>
		// 			</Tooltip>
		// 		</div>
		// 		<ul onClick={this.handleClickSelectStream}>
		// 			{this.renderStreams(this.props.channelStreams)}
		// 		</ul>
		// 	</div>
		// );
	};

	renderTeamChannels = () => {
		return (
			<div
				className={createClassString("section", "has-children", {
					expanded: this.state.expanded["teamChannels"]
				})}
			>
				<div className="header top" onClick={e => this.toggleSection(e, "teamChannels")}>
					<Icon name="triangle-right" className="triangle-right" />
					<span className="clickable">Channels</span>
					<div className="align-right">
						<Tooltip title="Browse all Channels" placement="left" delay="0.5">
							<span>
								<Icon name="list-unordered" onClick={this.handleClickShowPublicChannels} />
							</span>
						</Tooltip>
						<Tooltip title="Create a Channel" placement="left" delay="0.5">
							<span>
								<Icon name="plus" onClick={this.handleClickCreateChannel} />
							</span>
						</Tooltip>
					</div>
				</div>
				<ul onClick={this.handleClickSelectStream}>
					{this.renderStreams(this.props.channelStreams)}
				</ul>
			</div>
		);
	};

	renderServiceChannels = () => {
		if (this.props.serviceStreams.length === 0) return null;

		return (
			<div
				className={createClassString("section", "has-children", {
					expanded: this.state.expanded["liveShareSessions"]
				})}
			>
				<div className="header" onClick={e => this.toggleSection(e, "liveShareSessions")}>
					<Icon name="triangle-right" className="triangle-right" />
					<span className="clickable">Live Share Sessions</span>
				</div>
				<ul onClick={this.handleClickSelectStream}>
					{this.renderStreams(this.props.serviceStreams)}
				</ul>
			</div>
		);
	};

	renderStreams = streams => {
		return streams.map(stream => {
			if (stream.isArchived) return null;

			// FIXME remove this line once we're sure there are no PROD streams of this type
			// no new ones are being created
			if (stream.name.match(/^ls:/)) return null;

			const icon = this.props.mutedStreams[stream.id] ? (
				<Icon className="mute" name="mute" />
			) : stream.privacy === "private" ? (
				<Icon className="lock" name="lock" />
			) : stream.serviceType === "vsls" ? (
				<Icon className="broadcast" name="broadcast" />
			) : (
				<span className="icon hash">#</span>
			);
			let count = this.props.umis.unreads[stream.id] || 0;
			if (this.props.mutedStreams[stream.id]) count = 0;
			let mentions = this.props.umis.mentions[stream.id] || 0;
			let menuActive = this.state.openMenu === stream.id;
			return (
				<li
					className={createClassString({
						active: menuActive ? true : false,
						muted: this.props.mutedStreams[stream.id],
						unread: count > 0
					})}
					key={stream.id}
					id={stream.id}
				>
					{icon}
					<Debug text={stream.id}>{stream.name}</Debug>
					{mentions > 0 ? <span className="umi">{mentions}</span> : null}
					<span>
						<Tooltip title="Channel Settings">
							<Icon name="gear" className="align-right" onClick={this.handleClickStreamSettings} />
						</Tooltip>
						{menuActive && (
							<ChannelMenu
								stream={stream}
								target={this.state.menuTarget}
								umiCount={count}
								isMuted={this.props.mutedStreams[stream.id]}
								setActivePanel={this.props.setActivePanel}
								runSlashCommand={this.props.runSlashCommand}
								closeMenu={this.closeMenu}
							/>
						)}
					</span>
				</li>
			);
		});
	};

	renderDirectMessages = () => {
		let canUseTimestamp = true;
		let unsortedStreams = mapFilter(this.props.directMessageStreams, stream => {
			let count = this.props.umis.unreads[stream.id] || 0;
			// let mentions = this.props.umis.mentions[stream.id] || 0;
			if (this.props.mutedStreams[stream.id]) {
				// if you have muted a stream, check to see if there is a UMI.
				// if so, unmute the stream. if not, don't display it.
				if (count) this.props.changeStreamMuteState(stream.id, false);
				else return null;
			}

			let icon;
			if (stream.name === "slackbot") {
				icon = <Icon className="heart active" name="heart" />;
			} else if (stream.memberIds == null || stream.memberIds.length > 2) {
				icon = <Icon className="organization" name="organization" />;
			} else {
				const presence = this.props.streamPresence[stream.id];
				if (presence) {
					const className = `person ${presence}`;
					icon = <Icon className={className} name="person" />;
				} else {
					icon = <Icon className="person" name="person" />;
				}
			}

			const isMeStream = stream.id === this.props.meStreamId;

			let sortName;
			let sortPriority;
			let sortTimestamp;
			if (this.props.isSlackTeam) {
				sortTimestamp = stream.mostRecentPostCreatedAt;
				if (sortTimestamp == null) {
					canUseTimestamp = false;
				}
				sortPriority = stream.priority;

				if (stream.name === "slackbot") {
					sortTimestamp = 1539191617 * 10000;
					sortPriority = 100;
					sortName = ".";
				} else if (isMeStream) {
					sortTimestamp = 1539191617 * 90000;
					sortPriority = 99;
					sortName = "..";
				} else {
					sortName = stream.name ? stream.name.toLowerCase() : "";
				}

				if (count) {
					sortPriority += 1;
				}
			} else {
				sortTimestamp = isMeStream
					? 1539191617 * 90000
					: stream.mostRecentPostCreatedAt || stream.modifiedAt || 1;
				sortPriority = 0;

				if (isMeStream) {
					sortName = "..";
				} else {
					sortName = stream.name ? stream.name.toLowerCase() : "";
				}
			}

			return {
				sortName,
				sortPriority,
				sortTimestamp,
				element: (
					<li
						className={createClassString({
							direct: true,
							unread: count > 0
						})}
						key={stream.id}
						id={stream.id}
					>
						<Debug text={stream.id}>
							{icon}
							{stream.name} {isMeStream && <span className="you"> (you)</span>}
							{count > 0 ? <span className="umi">{count}</span> : null}
							<Tooltip title="Close Conversation">
								<Icon
									name="x"
									onClick={this.handleClickCloseDirectMessage}
									className="align-right"
								/>
							</Tooltip>
						</Debug>
					</li>
				)
			};
		});

		// show them all for now since we don't have a way to sort reliably
		let recentStreams;
		if (canUseTimestamp) {
			recentStreams = _.sortBy(unsortedStreams, s => -s.sortTimestamp);
		} else {
			recentStreams = _.sortBy(unsortedStreams, s => -s.sortPriority);
		}

		recentStreams = recentStreams.slice(0, 20);
		recentStreams.sort((a, b) => a.sortName.localeCompare(b.sortName));

		return (
			<div
				className={createClassString("section", "has-children", {
					expanded: this.state.expanded["directMessages"]
				})}
			>
				<div className="header" onClick={e => this.toggleSection(e, "directMessages")}>
					<Icon name="triangle-right" className="triangle-right" />
					<span className="clickable">Direct Messages</span>
					<div className="align-right">
						<Tooltip title="Open a direct message" placement="bottom" delay="0.5">
							<span>
								<Icon name="plus" onClick={this.handleClickCreateDirectMessage} />
							</span>
						</Tooltip>
					</div>
				</div>
				<ul onClick={this.handleClickSelectStream}>
					{_.sortBy(recentStreams, stream => stream.sortName).map(stream => stream.element)}
					<li className="invite" onClick={() => this.props.setActivePanel("invite")}>
						<span>
							<Icon name="plus-small" />
							{this.props.isSlackTeam ? "Invite People to CodeStream" : "Invite People"}
						</span>
					</li>
				</ul>
			</div>
		);
	};

	handleClickSelectStream = event => {
		event.preventDefault();
		var liDiv = event.target.closest("li");
		if (!liDiv) return; // FIXME throw error
		if (liDiv.id) {
			this.props.setActivePanel("main");
			this.props.setCurrentStream(liDiv.id);
		} else if (liDiv.getAttribute("teammate")) {
			this.props.createStream({ type: "direct", memberIds: [liDiv.getAttribute("teammate")] });
		} else {
			console.log("Unknown LI in handleClickSelectStream: ", event);
		}
	};

	handleClickCreateChannel = e => {
		e.stopPropagation();
		this.props.setActivePanel("create-channel");
	};

	handleClickShowPublicChannels = e => {
		e.stopPropagation();
		this.props.setActivePanel("public-channels");
	};

	handleClickCreateDirectMessage = e => {
		e.stopPropagation();
		this.props.setActivePanel("create-dm");
	};

	handleClickStreamSettings = event => {
		var liDiv = event.target.closest("li");
		if (!liDiv || !liDiv.id) return; // FIXME throw error
		this.setState({ openMenu: liDiv.id, menuTarget: event.target });
		event.stopPropagation();
		return true;
	};

	handleClickCloseDirectMessage = event => {
		event.stopPropagation();
		var liDiv = event.target.closest("li");
		if (!liDiv) return; // FIXME throw error
		const id = liDiv.id || liDiv.getAttribute("teammate");
		this.props.closeDirectMessage(id);
	};

	findStream = streamId => {
		return (
			this.props.channelStreams.find(stream => stream.id === streamId) ||
			this.props.directMessageStreams.find(stream => stream.id === streamId)
		);
	};

	closeMenu = () => {
		this.setState({ openMenu: null });
	};
}

const mapStateToProps = ({ context, preferences, streams, users, teams, umis, session }) => {
	const team = teams[context.currentTeamId];

	const teamMembers = team.memberIds.map(id => users[id]).filter(Boolean);
	// .filter(user => user && user.isRegistered);

	const channelStreams = _.sortBy(
		getChannelStreamsForTeam(streams, context.currentTeamId, session.userId) || [],
		stream => (stream.name || "").toLowerCase()
	);

	let meStreamId;
	let streamPresence = Object.create(null);
	const directMessageStreams = mapFilter(
		getDirectMessageStreamsForTeam(streams, context.currentTeamId) || [],
		stream => {
			if (
				stream.isClosed ||
				(stream.memberIds != null &&
					stream.memberIds.some(id => users[id] != null && users[id].deactivated))
			) {
				return;
			}

			if (stream.memberIds != null && stream.memberIds.length <= 2) {
				// this is my stream with myself, if it exists
				if (stream.memberIds.length === 1 && stream.memberIds[0] === session.userId) {
					meStreamId = stream.id;
					streamPresence[stream.id] = users[session.userId].presence;
				} else {
					const id = stream.memberIds[stream.memberIds[0] === session.userId ? 1 : 0];
					streamPresence[stream.id] = users[id].presence;
				}
			}

			return {
				...stream,
				name: getDMName(stream, toMapBy("id", teamMembers), session.userId)
			};
		}
	);

	const serviceStreams = _.sortBy(
		getServiceStreamsForTeam(streams, context.currentTeamId, session.userId, users) || [],
		stream => -stream.createdAt
	);

	return {
		umis,
		users,
		channelStreams,
		directMessageStreams,
		serviceStreams,
		mutedStreams: preferences.mutedStreams || {},
		meStreamId,
		streamPresence,
		team: teams[context.currentTeamId]
	};
};

export default connect(
	mapStateToProps,
	{
		changeStreamMuteState,
		closeDirectMessage,
		createStream,
		setCurrentStream
	}
)(SimpleChannelPanel);
