<script lang="ts">
	import {
		TOPOLOGY_ROWS,
		TRAINING_ADVICE,
		TUTORIAL_INTRO,
		TUTORIAL_STEPS,
		WHERE_LABEL
	} from './content';
</script>

<section class="tutorial" aria-label="Tutorial">
	<p class="tutorial-intro">{TUTORIAL_INTRO}</p>

	<ol class="tutorial-steps">
		{#each TUTORIAL_STEPS as step (step.id)}
			<li class="tutorial-step">
				<div class="tutorial-step-head">
					<span class="tutorial-n" aria-hidden="true">{step.n}</span>
					<div>
						<h2>{step.title}</h2>
						<span class="tutorial-where">{WHERE_LABEL[step.where]}</span>
					</div>
				</div>
				<p>{step.body}</p>
				{#if step.id === 'topology'}
					<div class="tutorial-table-wrap">
						<table class="tutorial-table">
							<thead>
								<tr>
									<th scope="col">Topology</th>
									<th scope="col">Typical presets</th>
									<th scope="col">ORT</th>
									<th scope="col">Transformers.js</th>
								</tr>
							</thead>
							<tbody>
								{#each TOPOLOGY_ROWS as row (row.topology)}
									<tr>
										<td><code>{row.topology}</code></td>
										<td>{row.presets}</td>
										<td><code>{row.ort}</code></td>
										<td>{row.transformersJs}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</li>
		{/each}
	</ol>

	<section class="tutorial-advice" aria-labelledby="training-advice-heading">
		<h2 id="training-advice-heading">Training advice: best inference results</h2>
		<ul>
			{#each TRAINING_ADVICE as tip (tip.title)}
				<li>
					<strong>{tip.title}</strong>
					<span>{tip.body}</span>
				</li>
			{/each}
		</ul>
	</section>
</section>
