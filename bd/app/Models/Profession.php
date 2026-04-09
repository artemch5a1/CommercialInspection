<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profession extends Model
{
    protected $fillable = ['name'];
    protected $table = 'professions';

    public function users()
    {
        return $this->hasMany(User::class, 'id_profession');
    }
}
