function drawParticles(particles)
% DRAW Particles
%
for j = 1:length(particles)
    pos = particles(j).position;
    plot(pos(1),pos(2), '.r');
end
end