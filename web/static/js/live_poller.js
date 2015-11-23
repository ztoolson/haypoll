// Import the Socket calls from phoenix.js
import { Socket } from "deps/phoenix/web/static/js/phoenix"

export var LivePoller = {
  init() {
    // If the element we're expecting doesn't exist on the page,
    // just exit out of the whole thing
    if (!$("#poll-id").length) { return }
    // Set up our channel for Polls
    let pollChannel = this.setupPollChannel()
    // Set up each of the voting buttons
    this.setupVoteButtons(pollChannel)
  },
  createSocket() {
    // Open up a new websocket connection
    let socket = new Socket("/socket")
    // And then connect to it
    socket.connect()
    // When we successfully open the connection, log out to the console that
    // we succeeded.
    socket.onOpen(() => console.log("Connected"))
    // And return out the socket
    return socket
  },
  setupPollChannel() {
    // Store the current object for use later
    let self = this
    // Call our createSocket() function above and store the created socket
    let socket = this.createSocket()
    // And grab the id of the poll we're subscribing to
    let pollId = $("#poll-id").val()
    // Next, specify that we want to join a polls channel of the polls: with the poll id.
    // Remember our code in PollChannel.ex that looked like: "polls:" <> poll_id
    let pollChannel = socket.channel("polls:" + pollId)
    // Set up a handler for when the channel receives a new_vote message
    pollChannel.on("new_vote", vote => {
      // Update the voted item's display
      self.updateDisplay(vote.entry_id)
    })
    // Finally, join the channel we created. On success, let the console know that we joined.
    // On failure, tell us why it errored out.
    pollChannel
      .join()
      .receive("ok", resp => { console.log("Joined") })
      .receive("error", reason => { console.log("Error: ", reason) })
    // Finally, return the whole channel we've created; we'll need that to push
    // messages out later.
    return pollChannel
  },
  updateDisplay(entryId) {
    // Store the current object for use later
    let self = this
    // Iterate over each entry
    $("li.entry").each(function() {
      // Store the current item
      let li = $(this)
      // If the entry ids match, update the number of votes for that element
      if (entryId == li.data("entry-id")) {
        // Get the number of current votes, parse it as an integer, and add one
        let newVotes = +(li.find(".votes").text()) + 1
        // And update the display for that entry
        self.updateEntry(li, newVotes)
      }
    })
  },
  updateEntry(li, newVotes) {
    // Find the .votes span and update it to whatever the new votes value is
    li.find(".votes").text(newVotes)
  },
  setupVoteButtons(pollChannel) {
    // Store the current object for use later
    let self = this
    // Set up our default click handler for votes
    $(".vote").on("click", event => {
      event.preventDefault()
      // Find the containing list item
      let li = $(event.currentTarget).parents("li")
      // Grab the entry id for what the user voted on
      let entryId = li.data("entry-id")
      // And the current poll
      let pollId = $("#poll-id").val()
      // And then push a new_vote message with the entry id onto the channel
      pollChannel.push("new_vote", { entry_id: entryId })
    })
  }
}