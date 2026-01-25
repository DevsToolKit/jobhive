import React from 'react';
import { Button } from '../ui/button';
import { GoArrowUpRight } from 'react-icons/go';
import CardHeader from './CardHeader';
import { Badge } from '../ui/badge';

function JobCard() {
  return (
    <div className="rounded-[20px] bg-[#f6f5f7] dark:bg-card p-1 w-full">
      <div className="p-5 bg-white dark:bg-card-secondary rounded-[16px] flex flex-col gap-3">
        <CardHeader companyName="Google" />
        <TagsContainer />
        <JobDescription />
      </div>
      <div className="p-5 flex flex-col gap-3">
        <Button className="w-full py-5" variant={'outline'}>
          View details
        </Button>
        <Button className="w-full py-5">
          Apply now on Linkedin <GoArrowUpRight />
        </Button>
      </div>
    </div>
  );
}

const TagsContainer = () => {
  return (
    <div className="flex flex-row gap-3">
      <Tags />
      <Tags />
      <Tags />
    </div>
  );
};

const Tags = () => {
  return <Badge>Tags</Badge>;
};

const JobDescription = () => {
  return (
    <div>
      <h2 className="text-[24px] font-semibold line-clamp-1">Full Stack Developer</h2>
      <p className="text-[16px] line-clamp-3">
        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Earum numquam, possimus ad tempora
        dolor ipsum aspernatur explicabo enim a quo ut voluptate iure cumque nemo, eveniet libero
        omnis? Culpa, eius?
      </p>
    </div>
  );
};
export default JobCard;
