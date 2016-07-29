# Right Now
- Startup script
  - Download repo specified in
  - Set environment variables

# Testing
- 


# Next Step
- Threaded Micro Processes
  - certain services which can be run in entirely seperate threads are peiced out
    - Renderer
    - Body Parsing and Validation
    - Emailing
  - each of these services are given a
    - manager
      - load balances, auto scales, maintains connection
    - simple router that provides the single task
  - The router speaks to the manager

# After
- Threaded Socket Connections
  - The reason this is avoided is because
    - They need to share session information
    - They need to share websocket groups/pools
      - all threads are emitted when a new person enters/leaves
    - They need to know 'taken/occupied/reserved' identifiers for transactions
  - This concept of shared events and memory is very important
    - its important who is the emitter of the event
      - is it dedicated to that thread?
      - does a failed attempt to mutate emit an error or reset?
      - can two threads what for the same event?

# Finally
- Shard Routes Based on Usage
  - Main Pages and Assets Will be used the most and ought to cached
  - Authentication should be its own aspect since it may be brute forced
  - Design Sessions will likely have minimal server interactions
  - Payment Gateways likely will be
