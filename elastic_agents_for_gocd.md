---
layout: default
title: RFC - Elastic agents for GoCD - Initial draft
permalink: /elastic_agents_for_gocd.html
---

# [RFC] Elastic agents for GoCD - Initial draft

**Comments welcome: [Here](https://docs.google.com/document/d/1Hf_6fpa1QZMM9U2niOwC74On-HKvj0wbQiWLy9WfDxk/edit).**

## Context

### What is this?

This is a feature that will allow a GoCD plugin to control the number of and kind of agents that will be made available
to a Go Server, depending on its load. Typically, these agents will be started when needed for a job, and shut down when
not needed. These agents can be in a data center or in the cloud, and can be physical or virtual.


### Why is this needed?

A feature like this can allow for more efficient use of agent machines, can allow flexible scaling and in some cases,
can reduce the cost of running agents. Imagine an automated performance test which runs occasionally and needs a lot of
machines. These machines can be started at the beginning of the performance test, possibly using some cloud service, and
then brought down when not needed. This feature should enable a more flexible and dynamic build grid.




## Current process of handling agents

Agents are currently started manually or automatically by scripts written by users. They are registered to the GoCD
server manually, on the [agents page](http://www.go.cd/documentation/user/current/navigation/agents_page.html#agents) or
automatically, using [auto-registration](http://www.go.cd/documentation/user/current/advanced_usage/agent_auto_register.html).


Idle agents, after registration with the server, continuously poll the server, asking for jobs to run. When a stage is
triggered, the jobs that need to be started are identified by the server. Suitable jobs are assigned to agents
(depending on resources and environments). The agents pick up the jobs and run them. Once finished, they start polling
the server for the next job to run.


1. When a job is [scheduled](#schedule), it is considered for [assignment](#assign) to an agent,
   and it waits in the queue for an idle agent to ping the server.
2. When an idle agent pings the server for work, assuming that resources and environments match, the agent is assigned
   the scheduled and waiting job.
3. Once the agent finishes running that job, it goes back into the idle agent pool, waiting for another,
   [suitable](#suitable) job to be scheduled and assigned to it.


See the image below to help make this a little more clear.

<center>
  <object data="gocd_rfc_elastic_agents/old-job-assignment.svg" type="image/svg+xml">
    You need a browser capable of viewing SVG.
  </object>
</center>


## Proposed process of handling elastic agents

The user configures (in the plugin settings page), one or more resources as special resources to be used by an elastic
agent plugin. The elastic agent plugin registers itself for those resources (say, "perf-test"). A job which has a
resource which matches that, will not be assigned to any agent, without consulting the plugin. The plugin decides
whether to assign an agent to a job, or to start another agent, when consulted by Go.

1. When a job is [scheduled](#schedule), if its resources contains a specific resource, the job is not considered for
   normal [assignment](#assign).

2. The corresponding plugin for that resource is contacted, and a list of all agents available (containing that
   resource, or matching all resources) is given to it, along with the job for which this assignment needs to be made.

3. The plugin has a few choices:
   1. It can choose one of the agents and tell the server to assign the job to that agent.
   2. It can tell the server to keep this job on hold, while it is starting up another agent or agents.
   3. It can tell the server to continue waiting for an agent to get free (could be same as point "b" above)

4. The server waits some time, and then comes back to the plugin, asking it to choose, again.

5. When an agent is chosen, by the plugin, it is assigned that job. Once the job is finished, the plugin gets a call
   back, telling it that the job is finished and its status (maybe it needs to cleanup or bring down the agent). This
   will also allow monitoring of agents, through a plugin.

See this image to help make this a little more clear. 

<center>
  <object data="gocd_rfc_elastic_agents/new-job-assignment.svg" type="image/svg+xml">
    You need a browser capable of viewing SVG.
  </object>
</center>


Then, see this image for a slightly more accurate representation.

<center>
  <object data="gocd_rfc_elastic_agents/new-job-assignment-proper.svg" type="image/svg+xml">
    You need a browser capable of viewing SVG.
  </object>
</center>


# Notes

* The plugin might want to know how many jobs are waiting to be scheduled, so that it can pre-start some agents, or
  start them together.


* What is the right message to send to the plugin?
   * "Hey plugin, I have these 10 idle agents of yours, and this job to assign. What do I do?" OR
   * "Hey plugin, I have these 10 idle agents of yours, and 5 jobs to assign. What do I do?"

  I feel that the first one (proposed above) is easier for the plugin author.


* Plugin conflict: What happens if plugin1 registers "resource1" and plugin2 registers "resource2", and a job needs
  both? Should probably ignore one plugin.

* Secure and insecure configuration information will need to be stored by GoCD, for the plugins. Need to provide a
  generic way for plugins to do this. The plugins will also need to be able to specify a UI for users to access and
  change the config.

* If we are telling the plugin that a job is finished, it will also need to be told about cancelled jobs. Reschedules
  have to go through the plugin, again, any way.

* Should there be an option to send a timed message to the plugin, if no jobs have been scheduled in a while? This could
  help to bring down unused agents.

* Plugin should be able to somehow know that the agent it started is now available. This is because the agent that it
  starts will directly register with Go, and the plugin will know about it only when the server asks it to assign a job.
  Some ID should be made available during registration. This ID should be passed back to the plugin? Maybe the agent
  GUID itself is good enough.


# Glossary

* <a name="schedule"></a>Scheduled: The state that a job is in, before it is assigned (see "Assigned") to an agent. A job can stay in a
  scheduled state for a long time, if all suitable (see "Suitable") agents are busy running other jobs.

* <a name="assign"></a>Assigned: The state that a job is in, when a suitable (see "Suitable") agent has been decided for it. The job state
  changes to "Preparing" once the agent actually picks up the job, and starts checking out materials, etc. in
  preparation for the job.

* <a name="suitable"></a>Suitable: An agent is said to be "suitable" for a job, if it has all the resources that the job needs, and is in the
  environment that the pipeline of this job is in.

# Comment on this draft

**Comments welcome: [Here](https://docs.google.com/document/d/1Hf_6fpa1QZMM9U2niOwC74On-HKvj0wbQiWLy9WfDxk/edit).**
